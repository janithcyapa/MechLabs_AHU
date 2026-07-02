// src/utils/TelemetryContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { type ReactNode } from "react";
import type { TelemetryContextType, FormattedTelemetryState } from "./types";

const TelemetryContext = createContext<TelemetryContextType | undefined>(
  undefined,
);

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false); // WebSocket status
  const defaultSensor = { t: 0, h: 0, c: 0, p: 0, a: 0, v: 0 };
  const [systemData, setSystemData] = useState<FormattedTelemetryState>({
    outside: { ...defaultSensor },
    room1_sensor1: { ...defaultSensor },
    room1_sensor2: { ...defaultSensor },
    supply: { ...defaultSensor },
    return: { ...defaultSensor },
    mixed: { ...defaultSensor },
    cooler: { ...defaultSensor },
    heated: { ...defaultSensor },
    mixer: 0,
    fan: 0,
    flowrate: 0,
    coolerState: false,
    heaterState: false,
    humidifierState: false,
  });

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
          const pVal = (val: any) => val != null ? Number(Number(val).toFixed(3)) : 0;
          const newState = {
            outside: {
              t: pVal(message.outdoor_t),
              h: pVal(message.outdoor_h),
              c: pVal(message.outdoor_c),
              p: pVal(message.outdoor_p),
              a: pVal(message.outdoor_a),
              v: pVal(message.outdoor_v),
            },
            room1_sensor1: {
              t: pVal(message.room1_1_t),
              h: pVal(message.room1_1_h),
              c: pVal(message.room1_1_c),
              p: pVal(message.room1_1_p),
              a: pVal(message.room1_1_a),
              v: pVal(message.room1_1_v),
            },
            room1_sensor2: {
              t: pVal(message.room1_2_t),
              h: pVal(message.room1_2_h),
              c: pVal(message.room1_2_c),
              p: pVal(message.room1_2_p),
              a: pVal(message.room1_2_a),
              v: pVal(message.room1_2_v),
            },
            supply: {
              t: pVal(message.supply_t),
              h: pVal(message.supply_h),
              c: pVal(message.supply_c),
              p: pVal(message.supply_p),
              a: pVal(message.supply_a),
              v: pVal(message.supply_v),
            },
            return: {
              t: pVal(message.return_t),
              h: pVal(message.return_h),
              c: pVal(message.return_c),
              p: pVal(message.return_p),
              a: pVal(message.return_a),
              v: pVal(message.return_v),
            },
            mixed: {
              t: pVal(message.mix_t),
              h: pVal(message.mix_h),
              c: pVal(message.mix_c),
              p: pVal(message.mix_p),
              a: pVal(message.mix_a),
              v: pVal(message.mix_v),
            },
            cooler: {
              t: pVal(message.cool_t),
              h: pVal(message.cool_h),
              c: pVal(message.cool_c),
              p: pVal(message.cool_p),
              a: pVal(message.cool_a),
              v: pVal(message.cool_v),
            },
            heated: {
              t: pVal(message.heat_t),
              h: pVal(message.heat_h),
              c: pVal(message.heat_c),
              p: pVal(message.heat_p),
              a: pVal(message.heat_a),
              v: pVal(message.heat_v),
            },
            mixer: pVal(message.mixer),
            fan: pVal(message.fan),
            flowrate: pVal(message.flow),
            coolerState: Boolean(message.cooler),
            heaterState: Boolean(message.heater),
            humidifierState: Boolean(message.humidifier),
          };
          setSystemData(newState);

          console.log("JSON Data:", message);
          console.log("System Data:", newState);
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
        systemData,
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
