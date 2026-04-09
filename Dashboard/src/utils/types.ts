export interface SensorData {
    ts: number;
    temp: number;
    hum: number;
    co2?: number;
    pressure?: number;
}

export type TelemetryState = Record<string, SensorData>;

export interface TelemetryContextType {
    telemetry: TelemetryState;
    hvacData: HVACSystemData;
    actuators: ControlSignals | null;
    systemStatus: { online: boolean; uptime: number };
    isConnected: boolean;
}

export interface WebSocketMessage {
    type: 'telemetry' | 'command' | 'ping';
    topic?: string;
    data?: SensorData;
}

export interface HVACSystemData {
    ambient: SensorData;
    intake: SensorData;
    return: SensorData;
    economizer: SensorData;
    afterCooling: SensorData;
    afterHeating: SensorData;
    releaseAir: SensorData;
    [roomKey: `room${number}`]: SensorData;
}

export interface RoomLayout {
    id: string;
    label: string;
    temp: number;
    co2?: number;
    hum: number;
    valve: number;
    colStart: number;
    rowStart: number;
    colSpan: number;
    rowSpan: number;
    isHub?: boolean;
};

export interface ControlSignals {
    intakeOpening: number;
    coolingCoil: number;
    heatingCoil: number;
    humidifier: number;
    blower: number;
    [vavKey: `vavRoom${number}`]: number;
}

export type SensorKey = 'ambient_temp' | 'ambient_hum' | 'room1_temp' | 'room2_temp' | 'supply_temp' | 'co2';