import type { HVACSystemData, ControlSignals, SensorData } from './types';

const defaultSensor: SensorData = {
  ts: 0,
  temp: 24.5,
  hum: 50,
  co2: 400,
  pressure: 1013,
  flowrate: 100,
};

export const dummyHvacData: HVACSystemData = {
  ambient: defaultSensor,
  intake: defaultSensor,
  economizer: defaultSensor,
  afterCooling: defaultSensor,
  afterHeating: defaultSensor,
  return: defaultSensor,
  releaseAir: defaultSensor,
  roomLeft: defaultSensor,
  roomRight: defaultSensor,
};

export const dummyActuators: ControlSignals = {
  intakeOpening: 50,
  coolingCoil: 1,
  heatingCoil: 0,
  humidifier: 1,
  blower: 50,
  vavRoom1: 40,
  vavRoom2: 40,
};
