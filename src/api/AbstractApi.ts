import core from '@/stores/core';

export default abstract class AbstractApi {
  protected cancelRequest(controller: AbortController | null, method = '') {
    const coreStorage = core();

    if (controller !== null) {
      if (coreStorage.debug) {
        console.debug('[CDEK] Cancelling previous request ' + method);
      }

      controller.abort();
    }
  }
}
