export const enum YandexMapErrorCode {
  SCRIPT_INIT,
  TIMEOUT,
  SCRIPT_ERROR,
  SERVICE_ERROR,
  // the service answered with an X-Service-Version of another major version
  SERVICE_VERSION_MISMATCH,
}
