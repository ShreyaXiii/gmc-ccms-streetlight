export type FaultCategory =
  | 'OPEN_CIRCUIT'
  | 'SHORT_CIRCUIT_OR_OVERCURRENT'
  | 'OVERVOLTAGE'
  | 'UNDERVOLTAGE'
  | 'LAMP_NOT_ILLUMINATING'
  | 'DAYTIME_LIGHT_ON'
  | 'CONTROLLER_OFFLINE'
  | 'SENSOR_ERROR'
  | 'UNEXPECTED_RELAY_STATE';

export type FaultSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AcknowledgmentStatus = 'UNACKNOWLEDGED' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface FaultRecord {
  id: string;
  lightId?: string;
  lightName?: string;
  controllerId: string;
  category: FaultCategory;
  severity: FaultSeverity;
  description: string;
  measuredValue: number;
  unit: string;
  configuredThreshold: number;
  timestamp: string;
  status: AcknowledgmentStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  recommendedAction: string;
  isSimulated: boolean;
  notes?: string;
}

export interface FaultThresholds {
  openCircuitMinCurrentA: number;     // e.g. 0.03 A
  overCurrentLimitA: number;          // e.g. 0.45 A for prototype LED, 10.0 A for mains
  underVoltageLimitV: number;         // e.g. 4.2 V DC / 195 V AC
  overVoltageLimitV: number;          // e.g. 5.6 V DC / 255 V AC
  daylightThresholdLux: number;       // e.g. 450 Lux
  daylightDurationSeconds: number;    // e.g. 10 s debounce
  controllerTimeoutSeconds: number;   // e.g. 30 s
  aggregateSensorMode: boolean;       // true if single feeder sensor used
}

export const DEFAULT_THRESHOLDS: FaultThresholds = {
  openCircuitMinCurrentA: 0.03,
  overCurrentLimitA: 0.45,
  underVoltageLimitV: 4.2,
  overVoltageLimitV: 5.6,
  daylightThresholdLux: 450,
  daylightDurationSeconds: 10,
  controllerTimeoutSeconds: 35,
  aggregateSensorMode: false,
};

