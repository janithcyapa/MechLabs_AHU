// src/utils/TelemetryContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { type ReactNode } from "react";
import type { TelemetryContextType } from "./types";

const TelemetryContext = createContext<TelemetryContextType | undefined>(
  undefined,
);

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false); // WebSocket status
  const [rawJson, setRawJson] = useState<any>(null);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const connectWebSocket = () => {
      // Connect directly to the ESP Access Point IP
      ws.current = new WebSocket("ws://192.168.4.1/ws");

      ws.current.onopen = () => {
        console.log("WebSocket Connected to ESP");
        if (isMounted) setIsConnected(true);
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          setRawJson(message);
          console.log("ESP JSON Data:", message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        if (isMounted) {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.current.onerror = () => ws.current?.close();
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws.current) ws.current.close();
    };
  }, []);

  const sendCommand = (_topic: string, payload: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    } else {
      console.warn("Cannot send command, WebSocket is disconnected.");
    }
  };

  return (
    <TelemetryContext.Provider
      value={{
        isConnected,
        sendCommand,
        rawJson,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = (): TelemetryContextType => {
  const context = useContext(TelemetryContext);
  if (!context)
    throw new Error("useTelemetry must be used within a TelemetryProvider");
  return context;
};
