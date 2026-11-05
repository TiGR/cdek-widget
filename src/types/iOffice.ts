import type { LngLat } from '@yandex/ymaps3-types/common/types';
import type { OfficeType } from '@/enums/OfficeType';

export interface iOffice {
  city_code: number;
  city: string;
  region: string;
  type: OfficeType;
  country_code: string;
  postal_code: string;
  have_cashless: boolean;
  have_cash: boolean;
  allowed_cod: boolean;
  is_dressing_room: boolean;
  code: string;
  name: string;
  address: string;
  work_time: string;
  location: LngLat;
  dimensions: Array<{
    depth: number;
    width: number;
    height: number;
  }> | null;
  weight_min: number;
  weight_max: number;
}
