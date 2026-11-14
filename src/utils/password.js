// 백엔드 PasswordPolicy.REGEX와 같은 규칙을 유지해야 한다.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[!-~]{8,64}$/;

export const PASSWORD_HINT = '영문자·숫자·특수문자 포함 8자 이상';

/**
 * @returns {string} 규칙에 맞으면 빈 문자열, 아니면 사용자에게 보여줄 안내 문구
 */
export function validatePassword(password) {
  if (PASSWORD_REGEX.test(password)) return '';
  return '비밀번호는 영문자, 숫자, 특수문자를 모두 포함해 8~64자로 입력해주세요.';
}
