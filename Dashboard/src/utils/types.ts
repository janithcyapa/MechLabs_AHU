export interface SensorData {
    ts: number;
    temp: number;
    hum: number;
    co2?: number;
    pressure?: number;
    flowrate?: number;
}

export type TelemetryState = Record<string, SensorData>;

export interface FormattedSensorData {
    t: number;
    h: number;
    c: number;
    p: number;
    a: number;
    v: number;
}

export interface FormattedTelemetryState {
    outside: FormattedSensorData;
    room1_sensor1: FormattedSensorData;
    room1_sensor2: FormattedSensorData;
    supply: FormattedSensorData;
    return: FormattedSensorData;
    mixed: FormattedSensorData;
    cooler: FormattedSensorData;
    heated: FormattedSensorData;
    mixer: number;
    fan: number;
    flowrate: number;
    coolerState: boolean;
    heaterState: boolean;
    humidifierState: boolean;
}

export interface TelemetryContextType {
    systemData: FormattedTelemetryState;
    sendCommand: (topic: string, payload: any) => void;
    isConnected: boolean;
    isRecording: boolean;
    experimentName: string | null;
    startRecording: (name: string, interval: number) => Promise<void>;
    stopRecording: () => Promise<void>;
    storageWarning: boolean;
    recordedPoints: number;
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
    [roomKey: `room${string}`]: SensorData;
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