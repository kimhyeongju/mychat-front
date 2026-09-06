import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'mychat_theme';

function getInitialTheme() {
  // index.html의 인라인 스크립트가 이미 document.documentElement.dataset.theme를 정해뒀으니,
  // React 쪽 상태도 그 값에서 그대로 시작해서 깜빡임 없이 이어받는다.
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error('useTheme은 ThemeProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}
