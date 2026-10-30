export interface RelayMapping {
  channel: number; // 1 to 6
  lightId: string;
  gpioPin: number;
  currentSensorPin?: number;
  simulationSwitchPin?: number;
}

export interface Controller {
  id: string; // e.g. "ESP32-GMC-01"
  name: string;
  location: string;
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  lastHeartbeat: string;
  uptimeSeconds: number;
  relayMappings: RelayMapping[];
  sensorConfig: {
    feederCurrentPin: number;
    voltagePin: number;
    ldrPin: number;
    voltageMultiplier: number;
    currentSensitivityMvPerA: number;
  };
  mqttBrokerUrl?: string;
  isSimulated: boolean;
}

