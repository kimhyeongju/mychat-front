import { useI18n } from '../context/LanguageContext';

/** 한국어 ⇄ English. 현재 언어가 아니라 "바꿀 언어"를 보여준다. */
export default function LanguageToggle({ floating = true }) {
  const { lang, toggleLang, t } = useI18n();

  return (
    <button
      type='button'
      className={`theme-toggle lang-toggle ${floating ? 'lang-toggle--floating' : ''}`}
      onClick={toggleLang}
      aria-label={t('lang.switchTo')}
      title={t('lang.switchTo')}
    >
      {lang === 'ko' ? 'EN' : '한'}
    </button>
  );
}
