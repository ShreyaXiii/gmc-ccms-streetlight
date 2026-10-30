export type MeasurementSource = 'measured' | 'calculated' | 'simulated' | 'unavailable';

export interface LightTelemetrySample {
  lightId: string;
  relayChannel: number;
  relayState: boolean;
  currentA: number;
  voltageV: number;
  powerW: number;
  currentSource: MeasurementSource;
  voltageSource: MeasurementSource;
  powerSource: MeasurementSource;
  simulatedFaultInput?: boolean;
}

export interface ControllerTelemetryPacket {
  controllerId: string;
  sequence: number;
  timestamp: string; // ISO-8601
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  ambientLightLux: number;
  ambientLightRaw?: number;
  feederCurrentA?: number; // Shared feeder current if configured
  feederVoltageV?: number;
  lights: LightTelemetrySample[];
  rssi?: number; // Wi-Fi signal strength in dBm
  freeHeapBytes?: number;
  uptimeSeconds?: number;
  isSimulated: boolean;
}

export type CommandType = 'SET_STATE' | 'SET_MODE' | 'SET_DIM' | 'PING' | 'RESET_FAULT';
export type CommandStatus = 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export interface DeviceCommand {
  commandId: string;
  controllerId: string;
  lightId?: string;
  relayChannel?: number;
  type: CommandType;
  payload: {
    state?: 'ON' | 'OFF';
    mode?: 'manual' | 'auto' | 'scheduled';
    dimLevel?: number;
  };
  operatorId: string;
  timestamp: string;
  status: CommandStatus;
  statusReason?: string;
  acknowledgedAt?: string;
  completedAt?: string;
}

export interface HistoricalReading {
  timestamp: string;
  voltage: number;
  current: number;
  power: number;
  energyKWh: number;
  ambientLight: number;
  state: 'ON' | 'OFF';
  lightId: string;
}

