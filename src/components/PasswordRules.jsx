import { useI18n } from '../context/LanguageContext';
import { checkPasswordRules } from '../utils/password';

/**
 * 비밀번호 규칙 체크리스트. 폼에 항상 보이고, 입력할 때마다 충족 여부가 바뀐다.
 * 아직 입력 전이면 모든 항목을 중립 상태로 보여줘서 규칙만 안내한다.
 */
export default function PasswordRules({ password }) {
  const { t } = useI18n();
  const touched = password.length > 0;

  return (
    <ul className='pw-rules' aria-live='polite'>
      {checkPasswordRules(password, t).map((rule) => {
        const state = !touched ? 'idle' : rule.ok ? 'ok' : 'fail';
        return (
          <li key={rule.key} className={`pw-rules__item pw-rules__item--${state}`}>
            <span aria-hidden='true'>
              {state === 'ok' ? '✓' : state === 'fail' ? '✕' : '○'}
            </span>{' '}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
