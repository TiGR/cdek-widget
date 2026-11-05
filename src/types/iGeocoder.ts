import type { YandexGeocoderKind } from '@/enums/YandexGeocoderKind';
import type { YandexGeocoderPrecision } from '@/enums/YandexGeocoderPrecision';

export interface iGeocoderComponent {
  name: string;
  kind: YandexGeocoderKind;
}

export interface iGeocoderMember {
  name: string;
  position: number[];
  kind: YandexGeocoderKind;
  precision: YandexGeocoderPrecision;
  formatted: string;
  country_code: string;
  postal_code: string | null;
  components: iGeocoderComponent[];
  bounds: {
    lower: number[];
    upper: number[];
  };
}

export interface iGeocoderResult {
  found: number;
  members: iGeocoderMember[];
}
