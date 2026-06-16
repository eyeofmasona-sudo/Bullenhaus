const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'src/app/crm/lib/i18n.tsx');
let original = fs.readFileSync(i18nPath, 'utf8');

// Extract dictionaries object string
const dictStart = original.indexOf('const dictionaries: Record<Locale, Dictionary> = {');
const dictEndIndex = original.indexOf('const LanguageContext', dictStart);
let dictStr = original.substring(dictStart, dictEndIndex).replace('const dictionaries: Record<Locale, Dictionary> = {', 'export const crmDictionaries: Record<string, any> = {');

const newContent = `import React from 'react';
import { useTranslation } from 'react-i18next';

${dictStr}

// Proxy hook to adapt existing CRM components to react-i18next
export function useI18n() {
  const { t, i18n } = useTranslation('crm');
  return {
    t: (key: string) => {
      const val = t(key);
      return val;
    },
    locale: i18n.language,
    setLocale: (l: string) => i18n.changeLanguage(l),
    toggleLocale: () => i18n.changeLanguage(i18n.language === 'en' ? 'de' : 'en')
  };
}
`;

fs.writeFileSync(i18nPath, newContent);
console.log("Rewrote src/app/crm/lib/i18n.tsx");
