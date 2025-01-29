import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import nl from './locales/nl.json';

const resources = {
	en: {
		common: en
	},
	nl: {
		common: nl
	},
	de: {
		common: de
	}
};

i18n.use(initReactI18next).init({
	compatibilityJSON: 'v3',
	resources,
	lng: 'en',
	interpolation: {
		escapeValue: false
	}
});

export default i18n;
