// src/TelemetryContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { type ReactNode } from "react";
import type {
  TelemetryContextType,
  TelemetryState,
  WebSocketMessage,
  HVACSystemData,
  SensorData,
  ControlSignals,
} from "./types";

const TelemetryContext = createContext<TelemetryContextType | undefined>(
  undefined,
);

// A default empty sensor to prevent "undefined" crashes before data arrives
const defaultSensor: SensorData = {
  ts: 0,
  temp: 0,
  hum: 0,
  pressure: 0,
  co2: 0,
};

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [telemetry, setTelemetry] = useState<TelemetryState>({});
  const [actuators, setActuators] = useState<ControlSignals | null>(null);
  const [systemStatus, setSystemStatus] = useState<{
    online: boolean;
    uptime: number;
  }>({
    online: false,
    uptime: 0,
  });
  const [lastSeen, setLastSeen] = useState<number>(Date.now());

  const [isConnected, setIsConnected] = useState<boolean>(false); // WebSocket status

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const connectWebSocket = () => {
      ws.current = new WebSocket("ws://localhost:8000/ws");

      ws.current.onopen = () => {
        console.log("WebSocket Connected");
        if (isMounted) setIsConnected(true);
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          const { topic, data }: any = message;

          // if (topic === "ahu/status") {
          //     setSystemStatus(prev => ({ ...prev, online: data === "online" }));
          // }
          // else
          if (topic === "ahu/heartbeat") {
            setSystemStatus((prev) => ({
              ...prev,
              uptime: data.uptime_s,
              online: true,
            }));
            setLastSeen(Date.now());
          } else if (topic === "ahu/telemetry/actuators") {
            setActuators({
              intakeOpening: data.mix_damper,
              coolingCoil: data.cool_coil,
              heatingCoil: data.heat_coil,
              humidifier: data.humidifier,
              blower: data.main_blower,
            });
          }

          if (message.type === "telemetry" && message.topic && message.data) {
            setTelemetry((prev) => ({
              ...prev,
              [message.topic as string]: message.data!,
            }));
          }
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

  useEffect(() => {
    const TIMEOUT_MS = 12000;

    const interval = setInterval(() => {
      const timeSinceLastSeen = Date.now() - lastSeen;

      if (timeSinceLastSeen > TIMEOUT_MS) {
        setSystemStatus((prev) => {
          if (prev.online === false) return prev; // Already offline
          return { ...prev, online: false };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSeen]);

  const hvacData: HVACSystemData = useMemo(() => {
    // Base mapping from MQTT topics to your strict interface
    const mappedData: HVACSystemData = {
      ambient: telemetry["ahu/telemetry/outside"] || defaultSensor,
      intake:
        telemetry["ahu/telemetry/intake"] ||
        telemetry["ahu/telemetry/outside"] ||
        defaultSensor,
      economizer: telemetry["ahu/telemetry/mix"] || defaultSensor,
      afterCooling: telemetry["ahu/telemetry/cooler"] || defaultSensor,
      afterHeating: telemetry["ahu/telemetry/heater"] || defaultSensor,
      return: telemetry["ahu/telemetry/return"] || defaultSensor,
      releaseAir: telemetry["ahu/telemetry/release"] || defaultSensor,
    };

    // Dynamically map zone topics to "room[X]"
    // e.g., "zone/north/telemetry" -> mappedData.roomNorth
    // Object.keys(telemetry).forEach(topic => {
    //     if (topic.startsWith("zone/")) {
    //         const parts = topic.split("/");
    //         if (parts.length >= 2) {
    //             // Capitalize the first letter for neatness (north -> roomNorth)
    //             const roomName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    //             mappedData[`room${roomName}`] = telemetry[topic];
    //         }
    //     }
    // });

    return mappedData;
  }, [telemetry]);

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        hvacData,
        actuators,
        systemStatus,
        isConnected,
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
