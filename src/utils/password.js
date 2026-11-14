// 백엔드 PasswordPolicy.REGEX와 같은 규칙을 유지해야 한다.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[!-~]{8,64}$/;

export const PASSWORD_HINT = '영문자·숫자·특수문자 포함 8자 이상';

/**
 * 규칙별 충족 여부. 입력하는 동안 폼에 체크리스트로 보여주는 데 쓴다.
 * 항목을 바꾸면 PASSWORD_REGEX도 같이 바꿔야 한다.
 */
export function checkPasswordRules(password) {
  return [
    {
      key: 'length',
      label: '8~64자',
      ok: password.length >= 8 && password.length <= 64,
    },
    { key: 'letter', label: '영문자 포함', ok: /[A-Za-z]/.test(password) },
    { key: 'number', label: '숫자 포함', ok: /[0-9]/.test(password) },
    {
      key: 'special',
      label: '특수문자 포함 (!@#$% 등)',
      ok: /[^A-Za-z0-9]/.test(password),
    },
    {
      key: 'chars',
      label: '공백·한글 사용 불가',
      ok: /^[!-~]*$/.test(password),
    },
  ];
}

/**
 * @returns {string} 규칙에 맞으면 빈 문자열, 아니면 사용자에게 보여줄 안내 문구
 */
export function validatePassword(password) {
  if (PASSWORD_REGEX.test(password)) return '';
  return '비밀번호는 영문자, 숫자, 특수문자를 모두 포함해 8~64자로 입력해주세요.';
}
