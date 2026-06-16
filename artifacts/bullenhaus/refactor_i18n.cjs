const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'src/app/crm/lib/i18n.tsx');
let code = fs.readFileSync(i18nPath, 'utf8');

// Replace standard imports
code = code.replace(
  'import React, { createContext, useContext, useMemo, useState } from "react";',
  'import React from "react";\nimport { useTranslation } from "react-i18next";'
);

// Remove the context creation and provider logic
code = code.replace(/const LanguageContext = createContext<any>\(null\);[\s\S]*?export function LanguageProvider.*?\{[\s\S]*?\n\}/, `export function LanguageProvider({ children }: { children: React.ReactNode }) { return <>{children}</>; }`);

// Rewrite useI18n
code = code.replace(/export function useI18n\(\) \{[\s\S]*?\}/, `export function useI18n() {
  const { t, i18n } = useTranslation('crm');
  return {
    t: (key: string) => t(key),
    locale: i18n.language,
    setLocale: (l: string) => i18n.changeLanguage(l),
    toggleLocale: () => i18n.changeLanguage(i18n.language === 'en' ? 'de' : 'en'),
  };
}`);

// Change `const dictionaries` to `export const crmDictionaries`
code = code.replace('const dictionaries: Record<Locale, Dictionary> = {', 'export const crmDictionaries: Record<string, any> = {');

fs.writeFileSync(i18nPath, code);
console.log("Refactored i18n.tsx");
