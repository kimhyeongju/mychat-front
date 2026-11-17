// 백엔드 UsernamePolicy 와 같은 규칙을 유지해야 한다.
export const USERNAME_MIN = 7;
export const USERNAME_MAX = 16;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

/** @returns {boolean} 규칙에 맞으면 true */
export function isValidUsername(username) {
  return (
    username.length >= USERNAME_MIN &&
    username.length <= USERNAME_MAX &&
    USERNAME_REGEX.test(username)
  );
}
