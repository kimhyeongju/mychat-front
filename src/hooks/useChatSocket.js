import { Client } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearAnonymousSession,
  ensureAnonymousSession,
  getStoredAnonymousId,
} from '../api/chat';
import { getAccessToken } from '../api/client';
function buildBrokerUrl() {
  // 같은 오리진의 /ws로 접속한다. 개발 환경에서는 Vite 프록시가 백엔드로 넘긴다.
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

/**
 * STOMP 연결을 한 개만 유지하고 구독을 관리한다.
 *
 * 신원은 CONNECT 시점에 서버가 확정하므로, 로그인 상태가 바뀌면
 * 연결을 끊고 다시 맺어야 한다.
 */
export function useChatSocket({ enabled = true } = {}) {
  const clientRef = useRef(null);
  const subscriptionsRef = useRef(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return undefined;

    let established = false;

    const client = new Client({
      brokerURL: buildBrokerUrl(),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // 재접속할 때마다 저장소의 최신 값을 읽는다.
      // 처음 만든 헤더를 계속 쓰면 만료된 토큰이나 폐기된 익명 세션으로 무한 재시도하게 된다.
      beforeConnect: async () => {
        if (!getAccessToken() && !getStoredAnonymousId()) {
          await ensureAnonymousSession().catch(() => {});
        }
        const headers = {};
        const currentToken = getAccessToken();
        const currentAnonymousId = getStoredAnonymousId();
        if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
        if (currentAnonymousId) headers['X-Anonymous-Id'] = currentAnonymousId;
        client.connectHeaders = headers;
      },
      onConnect: () => {
        established = true;
        setConnected(true);
        setError('');
      },
      onStompError: (frame) => {
        // 접속 단계에서 거부됐다면 보관 중인 익명 세션이 서버에 없다는 뜻이다.
        // 버려 두면 다음 재접속의 beforeConnect가 새로 발급받는다.
        if (!established) clearAnonymousSession();
        setError(frame.headers.message ?? '연결에 실패했습니다.');
        setConnected(false);
      },
      onWebSocketClose: () => {
        established = false;
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.clear();
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
    // 로그인 상태가 바뀌면 재연결되도록 토큰을 의존성에 둔다.
  }, [enabled, getAccessToken()]);

  const subscribe = useCallback((destination, handler) => {
    const client = clientRef.current;
    if (!client || !client.connected) return () => {};

    const subscription = client.subscribe(destination, (message) => {
      handler(JSON.parse(message.body));
    });
    subscriptionsRef.current.set(destination, subscription);

    return () => {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(destination);
    };
  }, []);

  const publish = useCallback((destination, body) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      throw new Error('연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.');
    }
    client.publish({ destination, body: JSON.stringify(body) });
  }, []);

  return { connected, error, subscribe, publish };
}
