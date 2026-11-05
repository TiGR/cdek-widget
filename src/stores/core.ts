import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { Popup } from '@/enums/Popup';
import { DeliveryMode } from '@/enums/DeliveryMode';
import type { iWidget } from '@/types/iWidget';
import type { iTariff } from '@/types/iTariff';

export default defineStore('core', () => {
  // the widget starts locked; Widget.init() unlocks it once location and offices are loaded
  const uiLoadLocksCounter = ref(1);

  const lockUi = () => {
    uiLoadLocksCounter.value++;
  };

  const unlockUi = () => {
    uiLoadLocksCounter.value--;
  };

  const openedPopups = reactive({
    [Popup.SUPPORT]: false,
    [Popup.MENU]: false,
    [Popup.FILTERS]: false,
    [Popup.INFO]: false,
  });

  const mode = ref<DeliveryMode>(DeliveryMode.OFFICE);
  const selected = ref(false);
  const params = reactive<iWidget>({} as iWidget);
  const selectedTariff = ref<iTariff | null>(null);
  const globalPopup = ref(false);

  const closePopups = () => {
    if (debug.value) console.debug('[CDEK] Closing all popups');

    openedPopups[Popup.MENU] = false;
    openedPopups[Popup.FILTERS] = false;
    openedPopups[Popup.SUPPORT] = false;
  };

  const togglePopup = (name: Popup) => {
    const newValue = !openedPopups[name];

    if (debug.value) console.debug('[CDEK] Toggle popup', name);

    openedPopups[name] = newValue;
  };

  const debug = computed(
    () => !!params.debug
      || (Object.prototype.hasOwnProperty.call(window, 'sessionStorage') && window.sessionStorage.getItem('CdekDebug')),
  );

  const tariffs = reactive<{ pickup: iTariff[]; office: iTariff[]; door: iTariff[] }>({
    pickup: [],
    office: [],
    door: [],
  });

  return {
    selected,
    params,
    selectedTariff,
    tariffs,
    uiLoadLocksCounter,
    lockUi,
    unlockUi,
    debug,
    openedPopups,
    togglePopup,
    closePopups,
    mode,
    globalPopup,
  };
});
