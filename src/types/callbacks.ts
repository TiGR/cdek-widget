import type { DeliveryMode } from '@/enums/DeliveryMode';
import type { iTariff } from '@/types/iTariff';
import type { iOffice } from '@/types/iOffice';
import type { iGeocoderMember } from '@/types/iGeocoder';

export type tCalculateFunction = (prices: {
  office: iTariff[];
  door: iTariff[];
  pickup: iTariff[];
}, address: {
  code?: number;
  address?: string;
}) => void;

export type tChooseFunction = (type: DeliveryMode, tariff: iTariff | null, target: iOffice | iGeocoderMember) => void;

export type tReadyFunction = () => void;
