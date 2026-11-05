import { createApp, toRaw, watch, type App } from 'vue';
import { createPinia, type Pinia } from 'pinia';
import { isCancel } from 'axios';
import { debounce } from 'lodash-es';
import { createYmaps } from 'vue-yandex-maps';
import type { LngLat } from '@yandex/ymaps3-types/common/types';
import app from '@/PopupWrapper.vue';
import i18n from '@/i18n';
import { widgetSchema } from '@/schema';
import core from '@/stores/core';
import map from '@/stores/map';
import search from '@/stores/search';
import YandexApi from '@/api/YandexApi';
import CdekApi from '@/api/CdekApi';
import { Lang } from '@/enums/Lang';
import { Popup } from '@/enums/Popup';
import { DeliveryMode } from '@/enums/DeliveryMode';
import { YandexGeocoderKind } from '@/enums/YandexGeocoderKind';
import { YandexMapZoomVariants } from '@/enums/YandexMapZoomVariants';
import type { iWidget } from '@/types/iWidget';
import type { iOffice } from '@/types/iOffice';
import type { iParcel } from '@/types/iParcel';
import type { iTariff } from '@/types/iTariff';
import type { iGeocoderMember } from '@/types/iGeocoder';

class Widget {
  private readonly params: iWidget;

  private readonly pinia: Pinia;

  private readonly yandexApi: YandexApi;

  private readonly cdekApi: CdekApi;

  private readonly app: App;

  private readonly div: HTMLElement;

  private readonly customDiv: boolean;

  // guards async callbacks created in init() from acting after destroy()
  private isDestroyed = false;

  // stop-functions for watch()/$subscribe()/$onAction()/debounce() created in init()
  private readonly disposers: Array<() => void> = [];

  constructor(input: iWidget) {
    if (!(window.self instanceof Window)) {
      throw '[CDEK] window.self should be instance of WindowProxy for proper work';
    }

    this.params = widgetSchema.validateSync(input) as iWidget;

    let yandexLang: string;

    switch (this.params.lang) {
      default:
      case Lang.RUS:
        yandexLang = 'ru_RU';
        break;
      case Lang.ENG:
        yandexLang = 'en_US';
        break;
    }

    if (this.params.hideDeliveryOptions[DeliveryMode.OFFICE] && this.params.hideDeliveryOptions[DeliveryMode.DOOR]) {
      throw new Error('Can`t hide door delivery and office delivery at one time');
    }

    this.pinia = createPinia();
    this.yandexApi = new YandexApi(this.params.apiKey, yandexLang, this.pinia);
    this.cdekApi = new CdekApi(this.params.servicePath, this.pinia);

    const el = window.document.getElementById(this.params.root);

    if (el === null) {
      // no container: create one, "root" becomes its class name
      this.div = window.document.createElement('div');
      this.div.className = this.params.root;

      if (!this.params.popup) {
        this.div.style.width = '800px';

        if (window.innerHeight > 500) {
          this.div.style.height = '600px';
        } else {
          this.div.style.height = '400px';
        }
      }

      window.document.body.appendChild(this.div);
      this.customDiv = true;
    } else {
      this.div = el;
      this.customDiv = false;
    }

    this.app = createApp(app);
    this.app.use(this.pinia).use(i18n(this.params.lang)).use(
      createYmaps({
        apikey: this.params.apiKey,
        lang: yandexLang,
        mapsScriptWaitDuration: 30000,
        mapsRenderWaitDuration: 30000,
      }),
    ).mount(this.div);

    this.init().then();
  }

  async updateOffices(offices: iOffice[]) {
    if (this.isDestroyed) return;

    const coreStore = core(this.pinia);
    const mapStore = map(this.pinia);

    if (coreStore.debug) {
      console.debug('[CDEK] Force updating offices');
    }

    coreStore.$patch({
      params: { ...coreStore.params, offices },
    });

    mapStore.offices = await this.cdekApi.getOffices();
  }

  async updateOfficesRaw(officesRaw: any) {
    if (this.isDestroyed) return;

    const coreStore = core(this.pinia);
    const mapStore = map(this.pinia);

    if (coreStore.debug) {
      console.debug('[CDEK] Force updating raw offices');
    }

    coreStore.$patch({
      params: {
        ...coreStore.params,
        officesRaw,
      },
    });

    mapStore.offices = await this.cdekApi.getOffices();
  }

  async updateLocation(location: any, zoom = YandexMapZoomVariants.GENERAL) {
    if (this.isDestroyed) return;

    const coreStore = core(this.pinia);
    const mapStore = map(this.pinia);

    if (coreStore.debug) {
      console.debug('[CDEK] Force updating location');
    }

    if (typeof location === 'string') {
      const geoData = await this.yandexApi.geocodeString(location);

      if (geoData.found > 0) {
        mapStore.location.center = geoData.members[0].position as LngLat;
        mapStore.location.zoom = zoom;
      }
    } else {
      mapStore.location.center = location;
      mapStore.location.zoom = zoom;
    }
  }

  async updateTariff(tariff: iTariff) {
    if (this.isDestroyed) return;

    const coreStore = core(this.pinia);

    if (coreStore.debug) {
      console.debug('[CDEK] Force updating prices');
    }

    coreStore.$patch({
      params: { ...coreStore.params, tariff },
    });

    coreStore.tariffs = await this.cdekApi.getPrice();
  }

  clearSelection() {
    if (this.isDestroyed) return;

    const coreStore = core(this.pinia);
    const mapStore = map(this.pinia);

    if (coreStore.debug) {
      console.debug('[CDEK] Clearing selected point');
    }

    coreStore.selected = false;
    coreStore.selectedTariff = null;
    mapStore.exactOffice = null;
    mapStore.pointInfo = null;
    mapStore.exactPoint = null;
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }

    const coreStore = core(this.pinia);

    this.isDestroyed = true;

    for (const dispose of this.disposers) {
      dispose();
    }

    this.disposers.length = 0;

    this.cdekApi.cancelOfficeRequest();
    this.cdekApi.cancelOfficesByCoordinateRequest();
    this.cdekApi.cancelPriceRequest();
    this.yandexApi.cancelGeocodeStringRequest();
    this.yandexApi.cancelGeocodeCoordinatesRequest();

    this.app.unmount();

    coreStore.$dispose();
    map(this.pinia).$dispose();
    search(this.pinia).$dispose();

    if (this.customDiv) {
      if (coreStore.debug) {
        console.debug('[CDEK] Widget used self-created div, removing it');
      }

      this.div.remove();
    }

    if (coreStore.debug) {
      console.debug('[CDEK] Widget destroyed, goodbye');
    }
  }

  open() {
    const coreStore = core(this.pinia);

    if (!coreStore.params.popup) {
      throw new Error('CDEK widget is not in popup');
    }

    coreStore.globalPopup = true;
  }

  close() {
    const coreStore = core(this.pinia);

    if (!coreStore.params.popup) {
      throw new Error('CDEK widget is not in popup');
    }

    coreStore.globalPopup = false;
  }

  addParcel(parcel: iParcel | iParcel[]) {
    const coreStorage = core(this.pinia);
    const goods = coreStorage.params.goods;

    if (Array.isArray(parcel)) {
      for (const el of parcel) {
        goods.push(el);
      }
    } else {
      goods.push(parcel);
    }

    coreStorage.$patch({
      params: { ...coreStorage.params, goods },
    });
  }

  getParcels() {
    return toRaw(core(this.pinia).params.goods);
  }

  resetParcels() {
    const coreStorage = core(this.pinia);

    coreStorage.$patch({ params: { ...coreStorage.params, goods: [] } });
  }

  selectOffice(code: string) {
    const coreStorage = core(this.pinia);
    const mapStorage = map(this.pinia);

    const exactOffice = mapStorage.offices.filter((office) => office.code === code);

    if (exactOffice.length > 0) {
      if (coreStorage.debug) {
        console.debug('[CDEK] Selected predefined office', toRaw(exactOffice[0]));
      }

      mapStorage.$patch({
        exactOffice: exactOffice[0],
        location: {
          ...mapStorage.location,
          center: exactOffice[0].location,
          zoom: 17,
        },
      });

      coreStorage.$patch({ selected: true });

      if (!coreStorage.openedPopups[Popup.INFO]) {
        coreStorage.togglePopup(Popup.INFO);
      }
    }
  }

  // limits offices and clicks to the country/province/locality of the initial map center
  private async fixBounds() {
    if (this.params.fixBounds === null) return;

    const coreStorage = core(this.pinia);
    const mapStorage = map(this.pinia);

    const geoData = await this.yandexApi.geocodeCoordinates(mapStorage.location.center);

    if (coreStorage.debug) {
      console.debug('[CDEK] Geocoded members for bounds', geoData);
    }

    if (geoData.found < 1) {
      console.warn('[CDEK] Unable to geocode bounds');

      return;
    }

    const targetMember = geoData.members.filter((val) => val.kind === this.params.fixBounds);

    if (targetMember.length < 1) {
      console.warn('[CDEK] Unable to find member with kind', this.params.fixBounds);

      return;
    }

    if (coreStorage.debug) {
      console.debug('[CDEK] Fixing map to ', targetMember[0]);
    }

    mapStorage.fixedBounds = targetMember[0].bounds;
    mapStorage.fixedParams[YandexGeocoderKind.COUNTRY] = targetMember[0].country_code.toLowerCase();

    targetMember[0].components.forEach((component) => {
      switch (component.kind) {
        case YandexGeocoderKind.LOCALITY:
          mapStorage.fixedParams[YandexGeocoderKind.LOCALITY] = component.name.toLowerCase();
          break;
        case YandexGeocoderKind.PROVINCE:
          mapStorage.fixedParams[YandexGeocoderKind.PROVINCE] = component.name.toLowerCase();
          break;
      }
    });
  }

  private async init() {
    const coreStorage = core(this.pinia);
    const mapStorage = map(this.pinia);
    const searchStorage = search(this.pinia);

    if (coreStorage.debug) {
      console.debug('[CDEK] Widget initialization started', toRaw(coreStorage.params));
    }

    coreStorage.$patch({
      params: this.params,
      mode: this.params.hideDeliveryOptions[DeliveryMode.OFFICE] ? DeliveryMode.DOOR : DeliveryMode.OFFICE,
    });

    searchStorage.$patch({
      hideFilters: this.params.hideFilters,
      filters: this.params.forceFilters,
    });

    const initializeLocationAndOffices = async () => {
      try {
        if (typeof this.params.defaultLocation === 'string') {
          const geoData = await this.yandexApi.geocodeString(this.params.defaultLocation);

          if (this.isDestroyed) return;

          if (geoData.found < 1) {
            throw new Error('[CDEK] Unable to geocode default location');
          }

          mapStorage.location.center = geoData.members[0].position as LngLat;
        } else {
          mapStorage.location.center = this.params.defaultLocation;
        }

        await this.fixBounds();

        if (this.isDestroyed) return;

        // without local offices they are loaded by the visible area, see debouncedLoadOfficesByBounds
        if (coreStorage.params.offices !== null || coreStorage.params.officesRaw !== null) {
          mapStorage.offices = await this.cdekApi.getOffices();

          if (this.isDestroyed) return;
        }

        if (coreStorage.params.selected.office !== null) {
          this.selectOffice(coreStorage.params.selected.office);
        }
      } catch (e) {
        if (!isCancel(e)) {
          console.error('[CDEK] Error initializing widget location/offices', e);
        }
      } finally {
        // releases the lock the core store starts with
        if (!this.isDestroyed) {
          coreStorage.unlockUi();
        }
      }
    };

    initializeLocationAndOffices().then();

    const debouncedLoadOfficesByBounds = debounce(async () => {
      if (this.isDestroyed) return;

      if (coreStorage.params.offices !== null || coreStorage.params.officesRaw !== null) {
        return;
      }

      searchStorage.loading = true;
      this.cdekApi.cancelOfficesByCoordinateRequest();

      try {
        mapStorage.offices = await this.cdekApi.getOfficesByCoordinate(mapStorage.polygonBounds);

        if (this.isDestroyed) return;

        if (coreStorage.params.selected.office !== null && mapStorage.exactOffice === null) {
          this.selectOffice(coreStorage.params.selected.office);
        }
      } catch (e) {
        if (!isCancel(e)) throw e;
      } finally {
        if (!this.isDestroyed) {
          searchStorage.loading = false;
        }
      }
    }, 500);

    this.disposers.push(() => debouncedLoadOfficesByBounds.cancel());

    // search field: geocodes the input, reloads offices when filters change
    const debouncedUpdate = debounce(async (input: string, forceUpdate = false) => {
      if (this.isDestroyed) return;

      try {
        if (forceUpdate) {
          if (coreStorage.params.offices !== null || coreStorage.params.officesRaw !== null) {
            mapStorage.offices = await this.cdekApi.getOffices();
          } else {
            mapStorage.offices = await this.cdekApi.getOfficesByCoordinate(mapStorage.polygonBounds);
          }

          if (this.isDestroyed) return;
        }

        const geoData = await this.yandexApi.geocodeString(input);

        if (this.isDestroyed) return;

        searchStorage.searchResults = geoData.members;
      } catch (e) {
        if (!isCancel(e)) throw e;
      } finally {
        if (!this.isDestroyed) {
          searchStorage.loading = false;
        }
      }
    }, 500);

    this.disposers.push(() => debouncedUpdate.cancel());

    const stopBoundsWatch = watch(
      () => [mapStorage.bounds.left, mapStorage.bounds.right],
      () => {
        debouncedLoadOfficesByBounds();
      },
    );

    this.disposers.push(stopBoundsWatch);

    const unsubscribeSearchStore = searchStorage.$subscribe(async (mutation, state) => {
      if (mutation.storeId !== 'search' || mutation.type !== 'patch object') {
        return;
      }

      let forceUpdate = false;

      if (mutation.payload.hasOwnProperty('filters')) {
        forceUpdate = true;
      }

      searchStorage.loading = true;
      this.cdekApi.cancelOfficeRequest();
      this.cdekApi.cancelOfficesByCoordinateRequest();
      this.yandexApi.cancelGeocodeStringRequest();

      await debouncedUpdate(state.value, forceUpdate);
    });

    this.disposers.push(unsubscribeSearchStore);

    // door mode: geocodes the clicked point
    const debouncedSearch = debounce(async (coordinates: LngLat) => {
      if (this.isDestroyed) return;

      try {
        const result = await this.yandexApi.geocodeCoordinates(coordinates);

        if (this.isDestroyed) return;

        if (result.found > 0) {
          mapStorage.$patch({
            pointInfo: result.members[0],
          });
        }

        searchStorage.loading = false;
      } catch (e) {
        if (!isCancel(e)) {
          searchStorage.loading = false;
          throw e;
        }
      }
    }, 2000);

    this.disposers.push(() => debouncedSearch.cancel());

    const stopExactPointWatch = watch(
      () => [mapStorage.exactPoint, mapStorage.pointInfo] as const,
      ([exactPoint, pointInfo]) => {
        if (exactPoint === null
          || (pointInfo !== null
            && pointInfo.position[0] === exactPoint[0]
            && pointInfo.position[1] === exactPoint[1])) {
          return;
        }

        searchStorage.loading = true;
        this.yandexApi.cancelGeocodeCoordinatesRequest();

        debouncedSearch(exactPoint);
      },
    );

    this.disposers.push(stopExactPointWatch);

    const debouncedPrice = debounce(async () => {
      if (this.isDestroyed) return;

      if (mapStorage.pointInfo === null && mapStorage.exactOffice === null) {
        return;
      }

      const address = {
        address: coreStorage.mode === DeliveryMode.DOOR ? mapStorage.pointInfo?.formatted : undefined,
        country_code: coreStorage.mode === DeliveryMode.DOOR ? mapStorage.pointInfo?.country_code : undefined,
        postal_code: coreStorage.mode === DeliveryMode.DOOR ? mapStorage.pointInfo?.postal_code : undefined,
        code: coreStorage.mode === DeliveryMode.OFFICE ? mapStorage.exactOffice?.city_code : undefined,
      };

      try {
        const priceData = await this.cdekApi.getPrice(address);

        if (this.isDestroyed) return;

        if (coreStorage.debug) {
          console.debug('[CDEK] Calculated prices', priceData, address);
        }

        coreStorage.tariffs = priceData;

        this.params.onCalculate?.bind(this, priceData, address)();
      } catch (e) {
        if (!isCancel(e)) throw e;
      }
    });

    this.disposers.push(() => debouncedPrice.cancel());

    // a point/office was selected
    const stopMapSelectionPriceWatch = watch(
      () => [mapStorage.exactOffice, mapStorage.pointInfo],
      () => {
        if (coreStorage.params.goods.length < 1 || coreStorage.params.from === null) {
          return;
        }

        if (coreStorage.debug) {
          console.debug('[CDEK] Catch map selection update, going price update');
        }

        this.cdekApi.cancelPriceRequest();

        debouncedPrice();
      },
    );

    this.disposers.push(stopMapSelectionPriceWatch);

    // parcels were changed
    const unsubscribeCoreGoodsPrice = coreStorage.$subscribe(async (mutation, state) => {
      if (mutation.storeId !== 'core'
        || mutation.type !== 'patch object'
        || state.params.goods.length < 1
        || coreStorage.params.from === null) {
        return;
      }

      this.cdekApi.cancelPriceRequest();

      await debouncedPrice();
    });

    this.disposers.push(unsubscribeCoreGoodsPrice);

    // TariffInfo/PostcodeRequestModal use $patch(fn) to signal the choice
    const unsubscribeSelectButton = coreStorage.$subscribe(async (mutation, state) => {
      if (mutation.storeId !== 'core'
        || mutation.type !== 'patch function'
        || (state.selectedTariff === null && !state.selected)) {
        return;
      }

      let target: any;

      if (state.mode === DeliveryMode.OFFICE) {
        target = toRaw(mapStorage.exactOffice);
      } else {
        target = toRaw(mapStorage.pointInfo) as iGeocoderMember;
        target = {
          city: target.components.filter((el: { kind: YandexGeocoderKind }) => el.kind === YandexGeocoderKind.LOCALITY)?.[0]?.name,
          ...target,
        };

        if (target.postal_code === null && coreStorage.params.requirePostcode) {
          console.warn('[CDEK] Select button clicked, but door postcode is empty', target);

          return;
        }
      }

      if (coreStorage.debug) {
        console.debug('[CDEK] Select button clicked', toRaw(state.selectedTariff), state.mode, target);
      }

      this.params.onChoose?.bind(this, state.mode, toRaw(state.selectedTariff), target)();
    });

    this.disposers.push(unsubscribeSelectButton);

    const unsubscribeUnlockUiAction = coreStorage.$onAction(({ name, store, after }) => {
      if (name !== 'unlockUi') return;

      after(() => {
        if (store.uiLoadLocksCounter > 0) return;

        if (store.debug) {
          console.debug(`[CDEK] Widget ${__VERSION__} has been loaded`);
        }

        this.params.onReady?.bind(this)();
      });
    });

    this.disposers.push(unsubscribeUnlockUiAction);
  }
}

export default Widget;
