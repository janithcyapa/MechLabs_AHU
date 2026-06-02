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
    roomOnline: boolean;
    uptime: number;
  }>({
    online: false,
    roomOnline: false,
    uptime: 0,
  });
  const [lastSeen, setLastSeen] = useState<number>(Date.now());
  const [lastRoomSeen, setLastRoomSeen] = useState<number>(Date.now());
  const [isConnected, setIsConnected] = useState<boolean>(false); // WebSocket status

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
          const topic = message.topic;

          if (topic === "ahu/heartbeat") {
            setSystemStatus((prev) => ({
              ...prev,
              uptime: message.uptime_s,
              online: true,
            }));
            setLastSeen(Date.now());
          } else if (topic === "ahu/telemetry/actuators") {
            setActuators({
              intakeOpening: message.mix_damper,
              coolingCoil: message.cool_coil,
              heatingCoil: message.heat_coil,
              humidifier: message.humidifier,
              blower: message.main_blower,
            });
          } else if (topic && topic.startsWith("ahu/telemetry/")) {
            setTelemetry((prev) => ({
              ...prev,
              [topic]: { ...message, _localTs: Date.now() },
            }));
            if (topic.startsWith("ahu/telemetry/room") || topic === "ahu/telemetry/release_flow") {
              setSystemStatus((prev) => ({ ...prev, roomOnline: true }));
              setLastRoomSeen(Date.now());
            }
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
      const timeSinceLastRoom = Date.now() - lastRoomSeen;

      setSystemStatus((prev) => {
        let updated = { ...prev };
        if (timeSinceLastSeen > TIMEOUT_MS && prev.online) {
          updated.online = false;
        }
        if (timeSinceLastRoom > 15000 && prev.roomOnline) {
          updated.roomOnline = false;
        }
        return (updated.online !== prev.online || updated.roomOnline !== prev.roomOnline) ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSeen, lastRoomSeen]);

  const sendCommand = (_topic: string, payload: any) => {
  if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    // ESP firmware expects the command payload as a flat JSON string
    ws.current.send(JSON.stringify(payload));
  } else {
    console.warn("Cannot send command, WebSocket is disconnected.");
  }
  };

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
      releaseAir: {
        ...(telemetry["ahu/telemetry/release"] || defaultSensor),
        flowrate: telemetry["ahu/telemetry/release_flow"]?.flowrate
      },
    };

    // Dynamically map room topics to "room[X]"
    // e.g., "ahu/telemetry/roomLeft" -> mappedData.roomLeft
    Object.keys(telemetry).forEach(topic => {
        if (topic.startsWith("ahu/telemetry/room")) {
            const roomNamePart = topic.substring("ahu/telemetry/".length);
            mappedData[roomNamePart as `room${string}`] = telemetry[topic];
        }
    });

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
        sendCommand,
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
