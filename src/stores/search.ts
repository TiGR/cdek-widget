import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type { OfficeType } from '@/enums/OfficeType';
import type { iGeocoderMember } from '@/types/iGeocoder';

export default defineStore('search', () => {
  const value = ref('');
  const loading = ref(false);

  const filters = reactive<{
    type: OfficeType | null;
    have_cashless: boolean | null;
    have_cash: boolean | null;
    allowed_cod: boolean | null;
    is_dressing_room: boolean | null;
  }>({
    type: null,
    have_cashless: null,
    have_cash: null,
    allowed_cod: null,
    is_dressing_room: null,
  });

  const hideFilters = reactive({
    type: false,
    have_cashless: false,
    have_cash: false,
    is_dressing_room: false,
  });

  const searchResults = ref<iGeocoderMember[]>([]);
  const showSearchField = ref(false);

  return { value, loading, filters, searchResults, hideFilters, showSearchField };
});
