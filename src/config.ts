export default {
  map: {
    defaultKey: import.meta.env.VITE_DEFAULT_KEY || 'yandex-api-key',
    apiVersion: 'v3',
    geocoderVersion: '1.x',
    timeout: 5000,
    defaultCenter: [37.622504, 55.753215] as [number, number],
    defaultZoom: 10,
    defaultDuration: 200,
  },
  promo: {
    url: 'https://cdek.ru',
    tel: {
      data: '88002501405',
      title: '8 800 250-14-05',
    },
    mail: 'sales@cdek.ru',
  },
};
