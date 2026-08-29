import { useCallback, useState } from 'react';

/**
 * @returns {{ position: {latitude:number, longitude:number} | null, status: 'idle'|'loading'|'ready'|'error', error: string, refresh: () => void }}
 */
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }

    setStatus('loading');
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setStatus('ready');
      },
      (err) => {
        setStatus('error');
        setError(
          err.code === err.PERMISSION_DENIED
            ? '위치 권한이 거부됐습니다. 브라우저 설정에서 위치 접근을 허용해주세요.'
            : '위치 정보를 가져오지 못했습니다.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { position, status, error, refresh };
}
