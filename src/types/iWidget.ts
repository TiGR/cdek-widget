import type { InferType } from 'yup';
import type { LngLat } from '@yandex/ymaps3-types/common/types';
import type { widgetSchema } from '@/schema';
import type { Lang } from '@/enums/Lang';
import type { iParcel } from '@/types/iParcel';
import type { iOffice } from '@/types/iOffice';
import type { tCalculateFunction, tChooseFunction, tReadyFunction } from '@/types/callbacks';
// @ext
import type { iExtensions } from '@/extensions/types';

export interface iWidget extends InferType<typeof widgetSchema> {
  goods: iParcel[];
  offices: iOffice[] | null;
  defaultLocation: string | LngLat;
  lang: Lang;
  onCalculate?: tCalculateFunction;
  onReady?: tReadyFunction;
  onChoose?: tChooseFunction;
  // @ext
  extensions?: iExtensions;
}
