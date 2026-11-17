// 백엔드 PasswordPolicy.REGEX와 같은 규칙을 유지해야 한다.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[!-~]{8,64}$/;

// 안내 문구는 i18n 키(pw.hint)를 쓴다. t 는 useI18n() 에서 받는다.

/**
 * 규칙별 충족 여부. 입력하는 동안 폼에 체크리스트로 보여주는 데 쓴다.
 * 항목을 바꾸면 PASSWORD_REGEX도 같이 바꿔야 한다.
 */
export function checkPasswordRules(password, t) {
  return [
    {
      key: 'length',
      label: t('pw.ruleLength'),
      ok: password.length >= 8 && password.length <= 64,
    },
    { key: 'letter', label: t('pw.ruleLetter'), ok: /[A-Za-z]/.test(password) },
    { key: 'number', label: t('pw.ruleNumber'), ok: /[0-9]/.test(password) },
    {
      key: 'special',
      label: t('pw.ruleSpecial'),
      ok: /[^A-Za-z0-9]/.test(password),
    },
    {
      key: 'chars',
      label: t('pw.ruleChars'),
      ok: /^[!-~]*$/.test(password),
    },
  ];
}

/**
 * @returns {string} 규칙에 맞으면 빈 문자열, 아니면 사용자에게 보여줄 안내 문구
 */
export function validatePassword(password, t) {
  if (PASSWORD_REGEX.test(password)) return '';
  return t('pw.invalid');
}
