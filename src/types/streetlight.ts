export type LightState = 'ON' | 'OFF';
export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
export type HardwareStatus = 'physical' | 'virtual' | 'unassigned';
export type ControlMode = 'manual' | 'auto' | 'scheduled';

export interface Streetlight {
  id: string;
  name: string;
  ward: number;
  streetName: string;
  latitude: number;
  longitude: number;
  controllerId: string;
  relayChannel: number | null; // 1-6 for physical ESP32 channels, null for virtual
  hardwareStatus: HardwareStatus;
  controlMode: ControlMode;
  state: LightState;
  healthStatus: HealthStatus;
  
  // Electrical Telemetry
  voltage: number;           // in Volts (e.g., 5.0V for DC prototype or 230V mains)
  current: number;           // in Amperes (e.g., 0.12A)
  power: number;             // in Watts (calculated or measured)
  energyKWh: number;         // in kilowatt-hours
  ambientLight: number;      // in Lux (from LDR)
  
  // Timestamps & Diagnostics
  lastCommunication: string; // ISO 8601
  lastFault?: string;
  lastFaultType?: string;
  lastFaultTime?: string;
  isSimulated?: boolean;
  maintenanceNotes?: string;
  monitoringEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StreetlightInput {
  name: string;
  ward: number;
  streetName: string;
  latitude: number;
  longitude: number;
  controllerId: string;
  relayChannel: number | null;
  hardwareStatus: HardwareStatus;
  controlMode: ControlMode;
  maintenanceNotes?: string;
}

