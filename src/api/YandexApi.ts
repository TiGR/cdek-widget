import axios from 'axios';
import { tap } from 'lodash-es';
import type { LngLat } from '@yandex/ymaps3-types/common/types';
import config from '@/config';
import core from '@/stores/core';
import AbstractApi from '@/api/AbstractApi';
import type { iGeocoderResult } from '@/types/iGeocoder';

export default class YandexApi extends AbstractApi {
  private readonly geocodeSrc: string;

  private geocodeStringAbort: AbortController | null;

  private geocodeCoordinatesAbort: AbortController | null;

  constructor(apiKey: string, lang: string) {
    super();
    this.geocodeStringAbort = this.geocodeCoordinatesAbort = null;
    this.geocodeSrc = tap(new URL(`https://geocode-maps.yandex.ru/${config.map.geocoderVersion}/`), (url) => {
      url.searchParams.set('apikey', apiKey);
      url.searchParams.set('lang', lang);
    }).toString();
  }

  cancelGeocodeStringRequest() {
    this.cancelRequest(this.geocodeStringAbort, 'geocodeString');
  }

  cancelGeocodeCoordinatesRequest() {
    this.cancelRequest(this.geocodeCoordinatesAbort, 'geocodeCoordinates');
  }

  async geocodeString(input: string): Promise<iGeocoderResult> {
    const coreStorage = core();

    if (input === '') {
      return {
        found: 0,
        members: [],
      };
    }

    this.cancelGeocodeStringRequest();
    this.geocodeStringAbort = new AbortController();

    return await axios.get(this.geocodeSrc, {
      params: {
        geocode: input,
        format: 'json',
      },
      signal: this.geocodeStringAbort.signal,
    }).then((result) => {
      if (coreStorage.debug) {
        console.debug('[CDEK] Geocode string response', result.data);
      }

      return this.formatGeocodeResponse(result.data.response);
    }).catch((e) => {
      if (axios.isCancel(e)) {
        if (coreStorage.debug) {
          console.debug('[CDEK] Geocode string request cancelled');
        }

        throw e;
      }

      console.error('[CDEK] Geocode String error', e);

      return this.formatGeocodeResponse({
        GeoObjectCollection: {
          metaDataProperty: {
            GeocoderResponseMetaData: {
              found: 0,
            },
          },
          featureMember: [],
        },
      });
    });
  }

  async geocodeCoordinates(coordinates: LngLat): Promise<iGeocoderResult> {
    const coreStorage = core();

    this.cancelGeocodeCoordinatesRequest();
    this.geocodeCoordinatesAbort = new AbortController();

    return await axios.get(this.geocodeSrc, {
      params: {
        geocode: `${coordinates[0]}, ${coordinates[1]}`,
        format: 'json',
        results: 50,
      },
      signal: this.geocodeCoordinatesAbort.signal,
    }).then((result) => {
      if (coreStorage.debug) {
        console.debug('[CDEK] Geocode coordinates response', result.data);
      }

      return this.formatGeocodeResponse(result.data.response);
    }).catch((e) => {
      if (axios.isCancel(e)) {
        if (coreStorage.debug) {
          console.debug('[CDEK] Geocode coordinates request cancelled');
        }

        throw e;
      }

      return this.formatGeocodeResponse({
        GeoObjectCollection: {
          metaDataProperty: {
            GeocoderResponseMetaData: {
              found: 0,
            },
          },
          featureMember: [],
        },
      });
    });
  }

  private formatGeocodeResponse(result: any): iGeocoderResult {
    return {
      found: parseInt(result.GeoObjectCollection.metaDataProperty.GeocoderResponseMetaData.found),
      members: result.GeoObjectCollection.featureMember.map((el: any) => ({
        position: el.GeoObject.Point.pos.split(' ').map((e: string) => parseFloat(e)),
        bounds: {
          lower: el.GeoObject.boundedBy.Envelope.lowerCorner.split(' ').map((e: string) => parseFloat(e)),
          upper: el.GeoObject.boundedBy.Envelope.upperCorner.split(' ').map((e: string) => parseFloat(e)),
        },
        name: el.GeoObject.name,
        kind: el.GeoObject.metaDataProperty.GeocoderMetaData.kind,
        precision: el.GeoObject.metaDataProperty.GeocoderMetaData.precision,
        formatted: el.GeoObject.metaDataProperty.GeocoderMetaData.Address.formatted,
        country_code: el.GeoObject.metaDataProperty.GeocoderMetaData.Address.country_code,
        postal_code: el.GeoObject.metaDataProperty.GeocoderMetaData.Address.postal_code || null,
        components: el.GeoObject.metaDataProperty.GeocoderMetaData.Address.Components.map((el: any) => ({
          kind: el.kind,
          name: el.name,
        })),
      })),
    };
  }
}
