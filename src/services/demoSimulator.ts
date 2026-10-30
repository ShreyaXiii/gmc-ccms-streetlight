import { Streetlight } from '../types/streetlight';
import { Controller } from '../types/controller';
import { FaultRecord } from '../types/fault';
import { MaintenanceTicket } from '../types/maintenance';
import { HistoricalReading, ControllerTelemetryPacket } from '../types/telemetry';

export const INITIAL_DEMO_CONTROLLER: Controller = {
  id: 'ESP32-GMC-01',
  name: 'Gandhidham Municipal Corporation - Sector 1 Gateway',
  location: 'Oslo Circle Control Cabinet, Gandhidham',
  ipAddress: '192.168.1.142',
  macAddress: 'C4:4F:33:8A:1E:9B',
  firmwareVersion: 'CCMS-v2.4.1-PROD',
  status: 'ONLINE',
  lastHeartbeat: new Date().toISOString(),
  uptimeSeconds: 86400 * 3 + 1420,
  isSimulated: true,
  relayMappings: [
    { channel: 1, lightId: 'SL-GMC-001', gpioPin: 26, currentSensorPin: 34, simulationSwitchPin: 18 },
    { channel: 2, lightId: 'SL-GMC-002', gpioPin: 27, currentSensorPin: 35, simulationSwitchPin: 19 },
    { channel: 3, lightId: 'SL-GMC-003', gpioPin: 14, currentSensorPin: 32, simulationSwitchPin: 21 },
    { channel: 4, lightId: 'SL-GMC-004', gpioPin: 12, currentSensorPin: 33, simulationSwitchPin: 22 },
    { channel: 5, lightId: 'SL-GMC-005', gpioPin: 13, currentSensorPin: 25, simulationSwitchPin: 23 },
    { channel: 6, lightId: 'SL-GMC-006', gpioPin: 15, currentSensorPin: 4, simulationSwitchPin: 5 },
  ],
  sensorConfig: {
    feederCurrentPin: 36, // ADC1_CH0
    voltagePin: 39,       // ADC1_CH3
    ldrPin: 34,           // Ambient light analog input
    voltageMultiplier: 5.0,
    currentSensitivityMvPerA: 185, // ACS712-05B
  },
};

export const INITIAL_DEMO_STREETLIGHTS: Streetlight[] = [
  {
    id: 'SL-GMC-001',
    name: 'Oslo Circle Mast 01',
    ward: 1,
    streetName: 'Oslo Circle, Main Arterial',
    latitude: 23.0782,
    longitude: 70.1345,
    controllerId: 'ESP32-GMC-01',
    relayChannel: 1,
    hardwareStatus: 'physical',
    controlMode: 'auto',
    state: 'ON',
    healthStatus: 'HEALTHY',
    voltage: 5.08,
    current: 0.142,
    power: 0.72,
    energyKWh: 4.85,
    ambientLight: 85,
    lastCommunication: new Date().toISOString(),
    isSimulated: true,
    monitoringEnabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    maintenanceNotes: 'Physical LED #1 on relay channel 1. Working normally.',
  },
  {
    id: 'SL-GMC-002',
    name: 'Tagore Road Pole 14',
    ward: 1,
    streetName: 'Tagore Road',
    latitude: 23.0760,
    longitude: 70.1380,
    controllerId: 'ESP32-GMC-01',
    relayChannel: 2,
    hardwareStatus: 'physical',
    controlMode: 'auto',
    state: 'ON',
    healthStatus: 'HEALTHY',
    voltage: 5.05,
    current: 0.138,
    power: 0.70,
    energyKWh: 4.72,
    ambientLight: 85,
    lastCommunication: new Date().toISOString(),
    isSimulated: true,
    monitoringEnabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    maintenanceNotes: 'Physical LED #2 on relay channel 2.',
  },
  {
    id: 'SL-GMC-003',
    name: 'Port Road Junction North',
    ward: 2,
    streetName: 'Kandla Port Road',
    latitude: 23.0715,
    longitude: 70.1412,
    controllerId: 'ESP32-GMC-01',
    relayChannel: 3,
    hardwareStatus: 'physical',
    controlMode: 'auto',
    state: 'ON',
    healthStatus: 'HEALTHY',
    voltage: 5.02,
    current: 0.145,
    power: 0.73,
    energyKWh: 4.90,
    ambientLight: 85,
    lastCommunication: new Date().toISOString(),
    isSimulated: true,
    monitoringEnabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    maintenanceNotes: 'Physical LED #3 on relay channel 3.',
  },
  {
    id: 'SL-GMC-004',
    name: 'Railway Station Approach 03',
    ward: 3,
    streetName: 'Railway Station Road',
    latitude: 23.0680,
    longitude: 70.1290,
    controllerId: 'ESP32-GMC-01',
    relayChannel: 4,
    hardwareStatus: 'physical',
    controlMode: 'manual',
    state: 'OFF',
    healthStatus: 'HEALTHY',
    voltage: 5.12,
    current: 0.000,
    power: 0.00,
    energyKWh: 3.80,
    ambientLight: 85,
    lastCommunication: new Date().toISOString(),
    isSimulated: true,
    monitoringEnabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    maintenanceNotes: 'Physical LED #4 on relay channel 4.',
  },
  {
    id: 'SL-GMC-005',
    name: 'Zanda Chowk Market Square',
    ward: 4,
    streetName: 'Zanda Chowk Central',
    latitude: 23.0810,
    longitude: 70.1310,
    controllerId: 'ESP32-GMC-01',
    relayChannel: 5,
    hardwareStatus: 'physical',
    controlMode: 'auto',
    state: 'ON',
    healthStatus: 'HEALTHY',
    voltage: 5.06,
    current: 0.140,
    power: 0.71,
    energyKWh: 4.65,
    ambientLight: 85,
    lastCommunication: new Date().toISOString(),
    isSimulated: true,
    monitoringEnabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    maintenanceNotes: 'Physical LED #5 on relay channel 5.',
  },
  {
    id: 'SL-GMC-006',
    name: 'Rotary Circle South 06',
    ward: 5,
    streetName: 'Rotary Circle Peripheral',
    latitude: 23.0845,
    longitude: 70.1400,
    controllerId: 'ESP32-GMC-01',
    relayChannel: 6,
    hardwareStatus: 'physical',
    controlMode: 'auto',
    state: 'ON',
    healthStatus: 'HEALTHY',
    voltage: 5.04,
    current: 0.141,
    power: 0.71,
    energyKWh: 4.77,
    ambientLight: 85,
    lastCommunication: new Date().toISOString(),
    isSimulated: true,
    monitoringEnabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    maintenanceNotes: 'Physical LED #6 on relay channel 6.',
  },
];

export const INITIAL_DEMO_FAULTS: FaultRecord[] = [
  {
    id: 'FLT-DEMO-001',
    lightId: 'SL-GMC-003',
    lightName: 'Port Road Junction North',
    controllerId: 'ESP32-GMC-01',
    category: 'UNDERVOLTAGE',
    severity: 'WARNING',
    description: 'Minor voltage fluctuation observed (4.85V, threshold 4.90V) due to feeder line impedance.',
    measuredValue: 4.85,
    unit: 'V',
    configuredThreshold: 4.90,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'ACKNOWLEDGED',
    acknowledgedBy: 'Operator GMC-104',
    acknowledgedAt: new Date(Date.now() - 3600000).toISOString(),
    recommendedAction: 'Monitor voltage profile during peak grid load hours.',
    isSimulated: true,
    notes: 'Observed during evening transition period.',
  },
];

export const INITIAL_DEMO_TICKETS: MaintenanceTicket[] = [
  {
    id: 'TCK-2026-001',
    faultId: 'FLT-DEMO-001',
    lightId: 'SL-GMC-003',
    lightName: 'Port Road Junction North',
    ward: 2,
    title: 'Routine Line Inspection & Terminal Tightening',
    description: 'Check junction terminal screws and inspect cable sleeve at pole base.',
    status: 'In Progress',
    priority: 'Medium',
    assignedTechnician: 'Ramesh Patel (Zone 2 Electrician)',
    createdBy: 'System Monitor',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date().toISOString(),
    inspectionNotes: [
      'Visual inspection completed on 2026-10-29. No physical wire breakage.',
      'Re-torqued junction terminal strip to 2.5 Nm.',
    ],
  },
];

/**
 * Generates realistic historical readings for a given time range (e.g., 1h, 4h, 8h, 12h, 24h, 7d)
 * Timestamped backwards from current time with genuine mathematical variation.
 */
export function generateHistoricalReadings(
  lightId: string,
  hoursBack: number,
  samplesCount: number = 30
): HistoricalReading[] {
  const readings: HistoricalReading[] = [];
  const nowMs = Date.now();
  const stepMs = (hoursBack * 3600 * 1000) / samplesCount;

  let currentKWh = 4.2;

  for (let i = samplesCount; i >= 0; i--) {
    const timestamp = new Date(nowMs - i * stepMs).toISOString();
    const hour = new Date(timestamp).getHours();

    // Natural night/day schedule: Night between 18:30 and 06:00
    const isNight = hour >= 19 || hour < 6;
    const baseLux = isNight ? 20 + Math.random() * 30 : 600 + Math.sin((hour - 6) / 12 * Math.PI) * 400;

    // Light is usually ON at night
    const state: 'ON' | 'OFF' = isNight ? 'ON' : 'OFF';
    const voltage = 5.0 + (Math.sin(i / 3) * 0.08) + (Math.random() * 0.04);
    const current = state === 'ON' ? 0.135 + (Math.random() * 0.015) : 0.000;
    const power = Number((voltage * current).toFixed(2));

    if (state === 'ON') {
      currentKWh += (power * (stepMs / 3600000)) / 1000;
    }

    readings.push({
      timestamp,
      voltage: Number(voltage.toFixed(2)),
      current: Number(current.toFixed(3)),
      power,
      energyKWh: Number(currentKWh.toFixed(4)),
      ambientLight: Math.round(baseLux),
      state,
      lightId,
    });
  }

  return readings;
}

