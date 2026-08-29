import { Client } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

const WS_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * @param {number} roomId
 * @param {(message: object) => void} onMessage - 새 메시지가 도착할 때마다 호출
 * @returns {{ connected: boolean, sendMessage: (memberId: number, content: string) => void }}
 */
export function useChatSocket(roomId, onMessage) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!roomId) return undefined;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/rooms/${roomId}`, (frame) => {
          onMessageRef.current(JSON.parse(frame.body));
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (memberId, content) => {
      const client = clientRef.current;
      if (!client || !client.connected) return;

      client.publish({
        destination: `/app/rooms/${roomId}/send`,
        body: JSON.stringify({ memberId, content }),
      });
    },
    [roomId],
  );

  return { connected, sendMessage };
}
