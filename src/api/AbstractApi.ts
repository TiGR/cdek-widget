import type { Pinia } from 'pinia';
import core from '@/stores/core';

export default abstract class AbstractApi {
  protected readonly pinia: Pinia;

  constructor(pinia: Pinia) {
    this.pinia = pinia;
  }

  protected cancelRequest(controller: AbortController | null, method = '') {
    const coreStorage = core(this.pinia);

    if (controller !== null) {
      if (coreStorage.debug) {
        console.debug('[CDEK] Cancelling previous request ' + method);
      }

      controller.abort();
    }
  }
}
