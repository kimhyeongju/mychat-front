import { useEffect, useRef } from 'react';

/**
 * 일정 간격으로 callback 을 다시 부른다. 탭이 숨겨져 있으면 쉬고, 다시 보이면 곧바로 한 번 부른다.
 * 첫 호출은 호출하는 쪽에서 직접 한다(이 훅은 "다시 부르기"만 맡는다).
 */
export default function usePolling(callback, intervalMs, enabled = true) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    const tick = () => {
      if (!document.hidden) saved.current();
    };
    const timer = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (!document.hidden) saved.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, enabled]);
}
