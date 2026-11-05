import { createI18n } from 'vue-i18n';
import { Lang } from '@/enums/Lang';

// Russian plural forms: 0 | 1 | 2-4 | 5+ ("дней | день | дня | дней")
const ruPluralization = (choice: number, choicesLength: number, _orgRule: any) => {
  if (choice === 0) {
    return 0;
  }

  const teen = choice > 10 && choice < 20;
  const endsWithOne = choice % 10 === 1;

  if (!teen && endsWithOne) {
    return 1;
  }

  if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
    return 2;
  }

  return choicesLength < 4 ? 2 : 3;
};

export default (locale: Lang = Lang.RUS) => createI18n({
  locale: locale.toString(),
  legacy: false,
  globalInjection: false,
  pluralizationRules: {
    rus: ruPluralization,
  },
});
