import axios, { AxiosHeaders } from 'axios';
import type { Pinia } from 'pinia';
import core from '@/stores/core';
import map from '@/stores/map';
import search from '@/stores/search';
import AbstractApi from '@/api/AbstractApi';
import { Currency } from '@/enums/Currency';
import { OfficeType } from '@/enums/OfficeType';
import { CdekDeliveryType } from '@/enums/CdekDeliveryType';
import { YandexMapErrorCode } from '@/enums/YandexMapErrorCode';
import type { iOffice } from '@/types/iOffice';
import type { iTariff } from '@/types/iTariff';

const officesPageSize = 500;

export default class CdekApi extends AbstractApi {
  private getOfficesAbort: AbortController | null;

  private getOfficesByCoordinateAbort: AbortController | null;

  private getPriceAbort: AbortController | null;

  private readonly servicePath: string;

  constructor(servicePath: string, pinia: Pinia) {
    super(pinia);
    this.getOfficesAbort = this.getPriceAbort = this.getOfficesByCoordinateAbort = null;
    this.servicePath = servicePath;
  }

  cancelOfficeRequest() {
    this.cancelRequest(this.getOfficesAbort, 'offices');
  }

  cancelOfficesByCoordinateRequest() {
    this.cancelRequest(this.getOfficesByCoordinateAbort, 'officesByCoordinate');
  }

  cancelPriceRequest() {
    this.cancelRequest(this.getPriceAbort, 'prices');
  }

  async getPrice(targetLocation?: { code?: number; address?: string; postal_code?: string | null; country_code?: string }) {
    const coreStorage = core(this.pinia);

    if (coreStorage.params.tariff) {
      if (coreStorage.debug) {
        console.debug('[CDEK] We have fixed price', coreStorage.params.tariff);
      }

      return this.mapTariffsWithTypes([coreStorage.params.tariff as iTariff]);
    } else if (targetLocation === undefined) {
      throw new Error('No location and no fixed tariff was passed to price calc');
    }

    if (coreStorage.debug) {
      console.debug('[CDEK] Loading prices from service');
    }

    this.cancelPriceRequest();
    this.getPriceAbort = new AbortController();

    return await axios.post(
      this.servicePath,
      {
        currency: Currency[coreStorage.params.currency as keyof typeof Currency],
        lang: coreStorage.params.lang,
        from_location: typeof coreStorage.params.from === 'string' ? {
          address: coreStorage.params.from,
        } : coreStorage.params.from,
        to_location: targetLocation,
        action: 'calculate',
        packages: coreStorage.params.goods,
      },
      {
        signal: this.getPriceAbort.signal,
      },
    ).then((result) => {
      this.ensureCompatibleServiceVersion(result.headers['x-service-version']);

      if (coreStorage.debug) {
        console.debug('[CDEK] Got prices from service', result.data.tariff_codes || []);
      }

      return this.mapTariffsWithTypes(result.data.tariff_codes || []);
    }).catch((e) => {
      if (axios.isCancel(e)) {
        if (coreStorage.debug) {
          console.debug('[CDEK] Price request cancelled');
        }

        throw e;
      }

      console.error('[CDEK] Service error', e);

      if (map(this.pinia).mapLoadError === YandexMapErrorCode.SERVICE_VERSION_MISMATCH) {
        throw e;
      }

      return this.mapTariffsWithTypes([]);
    });
  }

  async getOffices(): Promise<iOffice[]> {
    const searchStorage = search(this.pinia);
    const coreStorage = core(this.pinia);

    searchStorage.loading = true;

    if (coreStorage.params.offices !== null || coreStorage.params.officesRaw !== null) {
      if (coreStorage.debug) {
        console.debug('[CDEK] Using points from widget initializer');
      }

      return this.loadLocalOffices();
    }

    if (coreStorage.debug) {
      console.debug('[CDEK] Loading points from service');
    }

    const additionalParams: Record<string, boolean> = {};

    if (coreStorage.params.sender) {
      additionalParams.is_handout_only = false;
      additionalParams.is_reception = true;
    } else {
      additionalParams.is_handout = true;
    }

    this.cancelOfficeRequest();
    this.getOfficesAbort = new AbortController();

    // the first single-item page tells the total count; without the header the service doesn't paginate
    const offices = await this.fetchOfficePage(additionalParams, 1, 1).then((r) => {
      this.ensureCompatibleServiceVersion(r.headers['x-service-version']);

      if (!(r.headers instanceof AxiosHeaders) || !r.headers.has('x-total-elements')) {
        return Promise.all([this.fetchOfficePage(additionalParams, 0, null).then((r) => r.data)]);
      }

      return Promise.all(
        Array.from(
          {
            length: Math.ceil(parseInt(r.headers['x-total-elements']) / officesPageSize),
          },
          (_e, i) => this.fetchOfficePage(additionalParams, i, officesPageSize).then((r) => r.data),
        ),
      );
    }).then((o) => o.map((r) => (typeof r === 'string' ? JSON.parse(r) : r)).flat())
      .then(this.formatOffices)
      .catch((e) => {
        if (axios.isCancel(e)) {
          if (core(this.pinia).debug) {
            console.debug('[CDEK] Offices request cancelled');
          }

          throw e;
        }

        console.error('[CDEK] Service error', e);

        if (map(this.pinia).mapLoadError === YandexMapErrorCode.SERVICE_VERSION_MISMATCH) {
          throw e;
        }

        map(this.pinia).mapLoadError = YandexMapErrorCode.SERVICE_ERROR;

        return [];
      });

    if (coreStorage.debug) {
      console.debug('[CDEK] Got points', offices);
    }

    searchStorage.loading = false;

    return offices;
  }

  async getOfficesByCoordinate(params: Record<string, number>): Promise<iOffice[]> {
    const searchStorage = search(this.pinia);
    const coreStorage = core(this.pinia);

    searchStorage.loading = true;

    if (coreStorage.debug) {
      console.debug('[CDEK] Loading points by coordinate from service', params);
    }

    const additionalParams: Record<string, boolean> = {};

    if (coreStorage.params.sender) {
      additionalParams.is_handout_only = false;
      additionalParams.is_reception = true;
    } else {
      additionalParams.is_handout = true;
    }

    this.cancelOfficesByCoordinateRequest();
    this.getOfficesByCoordinateAbort = new AbortController();

    const offices = await axios.get(this.servicePath, {
      params: {
        ...searchStorage.filters,
        ...additionalParams,
        ...params,
        action: 'byCoordinate',
      },
      signal: this.getOfficesByCoordinateAbort.signal,
    }).then((r) => {
      this.ensureCompatibleServiceVersion(r.headers['x-service-version']);

      const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      const officeList = Array.isArray(data) ? data : data?.delivery_points || data?.items || [];

      return this.formatOffices(officeList);
    }).catch((e) => {
      if (axios.isCancel(e)) {
        if (core(this.pinia).debug) {
          console.debug('[CDEK] Offices by coordinate request cancelled');
        }

        throw e;
      }

      console.error('[CDEK] Service error', e);

      if (map(this.pinia).mapLoadError === YandexMapErrorCode.SERVICE_VERSION_MISMATCH) {
        throw e;
      }

      map(this.pinia).mapLoadError = YandexMapErrorCode.SERVICE_ERROR;

      return [];
    });

    if (coreStorage.debug) {
      console.debug('[CDEK] Got points by coordinate', offices);
    }

    searchStorage.loading = false;

    return offices;
  }

  async getOfficesByCoordinates(params: Record<string, number>): Promise<iOffice[]> {
    return this.getOfficesByCoordinate(params);
  }

  private async fetchOfficePage(additionalParams: Record<string, boolean>, pageNumber: number, sizeNumber: number | null) {
    return axios.get(this.servicePath, {
      params: {
        ...search(this.pinia).filters,
        ...additionalParams,
        action: 'offices',
        page: pageNumber,
        size: sizeNumber,
      },
      signal: this.getOfficesAbort ? this.getOfficesAbort.signal : undefined,
    });
  }

  private ensureCompatibleServiceVersion(serviceVersion: unknown) {
    // a service of another major version can't talk to this widget; no header means an old or custom service
    if (typeof serviceVersion !== 'string' || serviceVersion.split('.')[0] === __VERSION__.split('.')[0]) {
      return;
    }

    map(this.pinia).$patch({
      mapLoadError: YandexMapErrorCode.SERVICE_VERSION_MISMATCH,
      serviceVersion,
    });

    throw new Error(`Incompatible service version: ${serviceVersion}`);
  }

  // CDEK API delivery point -> iOffice; weights come in kilograms
  private formatOffices(offices: any[]): iOffice[] {
    return offices.map((e) => ({
      // @ext: keep fields a custom service adds (as with the offices option); the known ones are overwritten below
      ...e,
      city_code: e.location.city_code,
      city: e.location.city,
      type: e.type,
      postal_code: e.location.postal_code,
      country_code: e.location.country_code,
      region: e.location.region,
      have_cashless: e.have_cashless,
      have_cash: e.have_cash,
      allowed_cod: e.allowed_cod,
      is_dressing_room: e.is_dressing_room,
      code: e.code,
      name: e.name,
      address: e.location.address,
      work_time: e.work_time,
      location: [e.location.longitude, e.location.latitude],
      weight_min: e.weight_min * 1000 || 0,
      weight_max: e.weight_max * 1000 || 0,
      dimensions: e.dimensions || null,
    }));
  }

  // splits tariffs by delivery target, keeping only the codes allowed by the tariffs option
  private mapTariffsWithTypes(tariffs: iTariff[]) {
    const coreStorage = core(this.pinia);
    const priceData: { office: iTariff[]; door: iTariff[]; pickup: iTariff[] } = {
      office: [],
      door: [],
      pickup: [],
    };

    tariffs.map((tariff) => {
      switch (tariff.delivery_mode) {
        case CdekDeliveryType.DOOR_DOOR:
        case CdekDeliveryType.OFFICE_DOOR:
        case CdekDeliveryType.PICKUP_DOOR:
          if (coreStorage.params.tariffs.door.length > 0 && coreStorage.params.tariffs.door.indexOf(tariff.tariff_code) !== -1) {
            priceData.door.push(tariff);
          }
          break;
        case CdekDeliveryType.DOOR_OFFICE:
        case CdekDeliveryType.OFFICE_OFFICE:
        case CdekDeliveryType.PICKUP_OFFICE:
          if (coreStorage.params.tariffs.office.length > 0 && coreStorage.params.tariffs.office.indexOf(tariff.tariff_code) !== -1) {
            priceData.office.push(tariff);

            if (coreStorage.params.tariffs.pickup.length > 0 && coreStorage.params.tariffs.pickup.indexOf(tariff.tariff_code) !== -1) {
              priceData.pickup.push(tariff);
            }
          }
          break;
        case CdekDeliveryType.DOOR_PICKUP:
        case CdekDeliveryType.OFFICE_PICKUP:
        case CdekDeliveryType.PICKUP_PICKUP:
          if (coreStorage.params.tariffs.pickup.length > 0 && coreStorage.params.tariffs.pickup.indexOf(tariff.tariff_code) !== -1) {
            priceData.pickup.push(tariff);
          }
          break;
      }
    });

    return priceData;
  }

  // offices passed via the offices/officesRaw options are filtered locally
  private loadLocalOffices(): iOffice[] {
    const searchStorage = search(this.pinia);
    const coreStorage = core(this.pinia);

    const offices: iOffice[] = coreStorage.params.officesRaw
      ? this.formatOffices(
        Array.isArray(coreStorage.params.officesRaw)
          ? coreStorage.params.officesRaw
          : JSON.parse(coreStorage.params.officesRaw) || [],
      )
      : coreStorage.params.offices || [];

    return offices.filter(
      (office) => (searchStorage.filters.allowed_cod === null || office.allowed_cod === searchStorage.filters.allowed_cod)
        && (searchStorage.filters.type === null || searchStorage.filters.type === OfficeType.ALL || office.type === searchStorage.filters.type)
        && (searchStorage.filters.have_cash === null || office.have_cash === searchStorage.filters.have_cash)
        && (searchStorage.filters.have_cashless === null || office.have_cashless === searchStorage.filters.have_cashless)
        && (searchStorage.filters.is_dressing_room === null || office.is_dressing_room === searchStorage.filters.is_dressing_room),
    );
  }
}
