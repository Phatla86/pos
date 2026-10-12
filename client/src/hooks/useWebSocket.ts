'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  payload?: any;
}

export function useWebSocket(
  wsUrl: string,
  onMessageReceived: (msg: WebSocketMessage) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [statusText, setStatusText] = useState('Đang kết nối...');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!wsUrl || typeof window === 'undefined') return;

    try {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(pingIntervalRef.current as NodeJS.Timeout);
      clearTimeout(reconnectTimerRef.current as NodeJS.Timeout);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        const isCloud = wsUrl.includes('render.com');
        setStatusText(isCloud ? 'Cloud Zalo Realtime' : 'LAN: ' + wsUrl.replace(/^wss?:\/\//, ''));

        // Ping keepalive every 20s
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'PING' }));
            } catch {
              // Ignore
            }
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PONG') return;
          onMessageReceived(data);
        } catch (err) {
          console.error('[WebSocket Parse Error]:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusText('Mất kết nối (Đang thử lại...)');
        clearInterval(pingIntervalRef.current as NodeJS.Timeout);
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 3500);
      };

      ws.onerror = () => {
        setIsConnected(false);
        setStatusText('Đang kết nối lại...');
      };
    } catch {
      setIsConnected(false);
      setStatusText('Chưa kết nối máy chủ');
    }
  }, [wsUrl, onMessageReceived]);

  useEffect(() => {
    connect();

    // Auto-reconnect when phone screen turns on or user returns to Zalo tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      clearInterval(pingIntervalRef.current as NodeJS.Timeout);
      clearTimeout(reconnectTimerRef.current as NodeJS.Timeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return {
    isConnected,
    statusText,
    sendMessage,
    reconnect: connect,
  };
}
