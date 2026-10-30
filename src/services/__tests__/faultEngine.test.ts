import { describe, it, expect } from 'vitest';
import { evaluateStreetlightFaults, checkControllerHealth } from '../faultEngine';
import { Streetlight } from '../../types/streetlight';
import { Controller } from '../../types/controller';
import { DEFAULT_THRESHOLDS } from '../../types/fault';

const mockLight: Streetlight = {
  id: 'SL-GMC-TEST',
  name: 'Test Light',
  ward: 1,
  streetName: 'Test Road',
  latitude: 23.076,
  longitude: 70.134,
  controllerId: 'ESP32-GMC-01',
  relayChannel: 1,
  hardwareStatus: 'physical',
  controlMode: 'auto',
  state: 'ON',
  healthStatus: 'HEALTHY',
  voltage: 5.0,
  current: 0.14,
  power: 0.7,
  energyKWh: 1.0,
  ambientLight: 100,
  lastCommunication: new Date().toISOString(),
  monitoringEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Fault Detection Engine Tests', () => {
  it('detects healthy condition when measurements are within normal limits', () => {
    const faults = evaluateStreetlightFaults({
      streetlight: mockLight,
      ambientLightLux: 100,
    });
    expect(faults.length).toBe(0);
  });

  it('detects OPEN_CIRCUIT when light is commanded ON but current is below minimum threshold', () => {
    const openCircuitLight: Streetlight = {
      ...mockLight,
      state: 'ON',
      voltage: 5.0,
      current: 0.005, // Below DEFAULT_THRESHOLDS.openCircuitMinCurrentA (0.03A)
    };

    const faults = evaluateStreetlightFaults({
      streetlight: openCircuitLight,
      ambientLightLux: 100,
    });

    const openCircuit = faults.find((f) => f.category === 'OPEN_CIRCUIT');
    expect(openCircuit).toBeDefined();
    expect(openCircuit?.severity).toBe('CRITICAL');
  });

  it('does NOT classify zero current as open circuit when lamp is intentionally OFF', () => {
    const offLight: Streetlight = {
      ...mockLight,
      state: 'OFF',
      voltage: 5.0,
      current: 0.000,
    };

    const faults = evaluateStreetlightFaults({
      streetlight: offLight,
      ambientLightLux: 100,
    });

    const openCircuit = faults.find((f) => f.category === 'OPEN_CIRCUIT');
    expect(openCircuit).toBeUndefined();
  });

  it('detects SHORT_CIRCUIT_OR_OVERCURRENT when current exceeds safety limit', () => {
    const overcurrentLight: Streetlight = {
      ...mockLight,
      state: 'ON',
      current: 0.65, // Exceeds 0.45A threshold
    };

    const faults = evaluateStreetlightFaults({
      streetlight: overcurrentLight,
      ambientLightLux: 100,
    });

    const overCurrent = faults.find((f) => f.category === 'SHORT_CIRCUIT_OR_OVERCURRENT');
    expect(overCurrent).toBeDefined();
    expect(overCurrent?.severity).toBe('CRITICAL');
  });

  it('detects simulated fault switch trigger safely', () => {
    const faults = evaluateStreetlightFaults({
      streetlight: mockLight,
      ambientLightLux: 100,
      simulatedFaultSwitch: true,
    });

    const fault = faults.find((f) => f.category === 'SHORT_CIRCUIT_OR_OVERCURRENT');
    expect(fault).toBeDefined();
    expect(fault?.description).toContain('[SIMULATED]');
  });

  it('detects DAYTIME_LIGHT_ON when ambient light indicates broad daylight', () => {
    const dayLight: Streetlight = {
      ...mockLight,
      state: 'ON',
    };

    const faults = evaluateStreetlightFaults({
      streetlight: dayLight,
      ambientLightLux: 650, // Exceeds 450 Lux threshold
    });

    const daytimeFault = faults.find((f) => f.category === 'DAYTIME_LIGHT_ON');
    expect(daytimeFault).toBeDefined();
    expect(daytimeFault?.severity).toBe('WARNING');
  });

  it('detects UNDERVOLTAGE when line voltage sags', () => {
    const underVoltageLight: Streetlight = {
      ...mockLight,
      voltage: 3.8, // Below 4.2V threshold
    };

    const faults = evaluateStreetlightFaults({
      streetlight: underVoltageLight,
      ambientLightLux: 100,
    });

    const uvFault = faults.find((f) => f.category === 'UNDERVOLTAGE');
    expect(uvFault).toBeDefined();
  });

  it('detects controller offline status when heartbeat times out', () => {
    const mockController: Controller = {
      id: 'ESP32-TEST',
      name: 'Test Controller',
      location: 'Gandhidham',
      firmwareVersion: '1.0',
      status: 'ONLINE',
      lastHeartbeat: new Date(Date.now() - 60000).toISOString(), // 60s ago > 35s timeout
      uptimeSeconds: 1000,
      isSimulated: true,
      relayMappings: [],
      sensorConfig: {
        feederCurrentPin: 36,
        voltagePin: 39,
        ldrPin: 34,
        voltageMultiplier: 5,
        currentSensitivityMvPerA: 185,
      },
    };

    const result = checkControllerHealth(mockController, DEFAULT_THRESHOLDS);
    expect(result.isOffline).toBe(true);
    expect(result.fault?.category).toBe('CONTROLLER_OFFLINE');
  });
});

