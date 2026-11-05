import { array, boolean, lazy, mixed, number, object, string } from 'yup';
import type { LngLat } from '@yandex/ymaps3-types/common/types';
import config from '@/config';
import { OfficeType } from '@/enums/OfficeType';
import { DeliveryMode } from '@/enums/DeliveryMode';
import { YandexGeocoderKind } from '@/enums/YandexGeocoderKind';
import { Lang } from '@/enums/Lang';
import { Currency } from '@/enums/Currency';
import type { tCalculateFunction, tChooseFunction, tReadyFunction } from '@/types/callbacks';

export const widgetSchema = object({
  apiKey: string().required().default(config.map.defaultKey), // Legacy - apikey
  root: string().default('cdek-map').trim(), // Legacy - link
  sender: boolean().default(false), // No Legacy variant
  canChoose: boolean().default(true), // Legacy - choose
  popup: boolean().default(false), // Legacy - popup
  servicePath: string().default('/service.php'), // Legacy - servicepath
  hideFilters: object({
    have_cashless: boolean().default(false), // No Legacy variant
    have_cash: boolean().default(false), // Legacy - hidecash
    is_dressing_room: boolean().default(false), // Legacy - hidedress
    type: boolean().default(false), // No Legacy variant
  }), // No Legacy variant
  forceFilters: object({
    have_cashless: boolean().nullable().default(null), // No Legacy variant
    have_cash: boolean().nullable().default(null), // No Legacy variant
    is_dressing_room: boolean().nullable().default(null), // No Legacy variant
    type: string<OfficeType>().nullable().oneOf(Object.values(OfficeType)).default(null), // No Legacy variant
    allowed_cod: boolean().nullable().default(null), // No Legacy variant
  }), // No Legacy variant
  hideDeliveryOptions: object({
    // Legacy - hidedelt
    [DeliveryMode.OFFICE]: boolean().default(false), // No Legacy variant
    [DeliveryMode.DOOR]: boolean().default(false), // No Legacy variant
  }), // No Legacy variant
  debug: boolean().default(false), // Legacy - showLogs
  requirePostcode: boolean().default(false),
  fixBounds: string<YandexGeocoderKind.COUNTRY | YandexGeocoderKind.PROVINCE | YandexGeocoderKind.LOCALITY>()
    .oneOf([YandexGeocoderKind.COUNTRY, YandexGeocoderKind.PROVINCE, YandexGeocoderKind.LOCALITY])
    .nullable()
    .default(null),
  offices: array().nullable().default(null),
  officesRaw: array().nullable().default(null),
  tariff: object({
    tariff_code: number(),
    tariff_name: string(),
    tariff_description: string(),
    delivery_mode: number(),
    period_min: number(),
    period_max: number(),
    delivery_sum: number(),
  }).nullable().default(null),
  goods: array().required().ensure().of(
    object({
      width: number().required(), // Legacy - goods.width
      length: number().required(), // Legacy - goods.length
      height: number().required(), // Legacy - goods.height
      weight: number().required(), // Legacy - goods.weight
    }),
  ), // Legacy - goods
  from: lazy((val) => (typeof val === 'string'
    ? string().nullable().default(null)
    : object({
      code: number().nullable().default(null),
      postal_code: string().nullable().default(null),
      country_code: string().nullable().default(null),
      city: string().nullable().default(null),
      address: string().nullable().default(null),
    }).nullable().default(null))), // Legacy - from
  defaultLocation: mixed<string | LngLat>(
    (input): input is string | LngLat => Array.isArray(input) || typeof input === 'string',
  ).required(), // Legacy - defaultCity
  lang: string<Lang>().oneOf(Object.values(Lang)).default(Lang.RUS), // Legacy - lang
  currency: string().oneOf(Object.keys(Currency)).default('RUB'), // Legacy - currency
  tariffs: object({
    door: array().default([480, 482, 184, 186, 7, 8, 231, 233, 293, 294, 137, 139, 16, 18, 11, 1, 3, 61, 60, 59, 58, 57, 83]), // Legacy - service.php
    office: array().default([481, 483, 185, 187, 232, 291, 295, 234, 136, 138, 15, 17, 10, 12, 5, 62, 63]), // Legacy - service.php
    pickup: array().default([361, 363, 366, 368, 376, 378, 497, 498, 485, 486]),
  }),
  onReady: mixed<tReadyFunction>((input): input is tReadyFunction => typeof input === 'function').default(() => {}),
  onCalculate: mixed<tCalculateFunction>((input): input is tCalculateFunction => typeof input === 'function').default(() => {}),
  onChoose: mixed<tChooseFunction>((input): input is tChooseFunction => typeof input === 'function').default(() => {}),
  selected: object({
    door: string().nullable().default(null),
    office: string().nullable().default(null),
  }),
});
