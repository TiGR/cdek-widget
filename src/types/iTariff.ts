import type { CdekDeliveryType } from '@/enums/CdekDeliveryType';

export interface iTariff {
  tariff_code: number;
  tariff_name: string;
  tariff_description: string;
  delivery_mode: CdekDeliveryType;
  period_min: number;
  period_max: number;
  delivery_sum: number;
}
