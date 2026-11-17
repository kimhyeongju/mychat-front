import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLanguage, setLanguage } from '../api/client';
import { en, ko } from '../i18n/messages';

const DICTIONARIES = { ko, en };
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getLanguage);

  // 서버 오류 문구(Accept-Language)와 같은 값을 쓰도록 localStorage에도 저장한다.
  useEffect(() => {
    setLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key, params) => {
      const dict = DICTIONARIES[lang];
      // n 이 1 이면 'key.one' 이 있을 때 그것을 쓴다(영어 단수형).
      const one = params?.n === 1 ? dict[`${key}.one`] : undefined;
      const text = one ?? dict[key] ?? ko[key] ?? key;
      if (!params) return text;
      return text.replace(/\{(\w+)\}/g, (m, name) =>
        params[name] !== undefined ? String(params[name]) : m,
      );
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      locale: lang === 'en' ? 'en-US' : 'ko-KR',
      setLang: (next) => setLangState(next === 'en' ? 'en' : 'ko'),
      toggleLang: () => setLangState((prev) => (prev === 'en' ? 'ko' : 'en')),
      t,
    }),
    [lang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}
