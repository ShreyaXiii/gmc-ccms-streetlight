import { FaultRecord, FaultThresholds, DEFAULT_THRESHOLDS } from '../types/fault';
import { Streetlight } from '../types/streetlight';
import { Controller } from '../types/controller';

export interface DetectionInput {
  streetlight: Streetlight;
  ambientLightLux: number;
  thresholds?: FaultThresholds;
  simulatedFaultSwitch?: boolean;
}

/**
 * Robust Fault Detection Engine for Municipal Street Lighting
 * Evaluates telemetry against physical and algorithmic limits.
 */
export function evaluateStreetlightFaults(input: DetectionInput): FaultRecord[] {
  const { streetlight, ambientLightLux, simulatedFaultSwitch = false } = input;
  const thresholds = input.thresholds || DEFAULT_THRESHOLDS;
  const faults: FaultRecord[] = [];
  const now = new Date().toISOString();

  // If monitoring is disabled, skip fault raising
  if (!streetlight.monitoringEnabled) {
    return [];
  }

  // 1. OVERCURRENT / SIMULATED SHORT-CIRCUIT FAULT
  // Detects critical overcurrent condition or prototype safety switch trigger
  if (simulatedFaultSwitch || streetlight.current > thresholds.overCurrentLimitA) {
    faults.push({
      id: `FLT-OC-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'SHORT_CIRCUIT_OR_OVERCURRENT',
      severity: 'CRITICAL',
      description: simulatedFaultSwitch
        ? `[SIMULATED] Safe short-circuit switch triggered on Relay Channel ${streetlight.relayChannel || 'N/A'}`
        : `Critical Overcurrent detected: ${streetlight.current.toFixed(2)}A exceeded safety threshold ${thresholds.overCurrentLimitA}A`,
      measuredValue: streetlight.current,
      unit: 'A',
      configuredThreshold: thresholds.overCurrentLimitA,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction: 'Immediate automated circuit cutoff. Inspect wiring and LED driver for short-circuit or physical insulation breakdown.',
      isSimulated: simulatedFaultSwitch || streetlight.isSimulated || false,
    });
  }

  // 2. OPEN CIRCUIT FAULT
  // Lamp is commanded ON, voltage is present, but current is below minimum load threshold
  if (
    streetlight.state === 'ON' &&
    streetlight.current < thresholds.openCircuitMinCurrentA &&
    streetlight.voltage >= thresholds.underVoltageLimitV
  ) {
    faults.push({
      id: `FLT-OPEN-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'OPEN_CIRCUIT',
      severity: 'CRITICAL',
      description: `Open-circuit detected: Light is commanded ON with ${streetlight.voltage.toFixed(1)}V applied, but current is ${streetlight.current.toFixed(3)}A (< ${thresholds.openCircuitMinCurrentA}A).`,
      measuredValue: streetlight.current,
      unit: 'A',
      configuredThreshold: thresholds.openCircuitMinCurrentA,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction: 'Verify physical lamp fixture, relay contacts, wire terminals, and lamp burnout.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  // 3. OVERVOLTAGE FAULT
  if (streetlight.voltage > thresholds.overVoltageLimitV) {
    faults.push({
      id: `FLT-OV-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'OVERVOLTAGE',
      severity: 'WARNING',
      description: `High voltage spike detected: ${streetlight.voltage.toFixed(1)}V (threshold: ${thresholds.overVoltageLimitV}V).`,
      measuredValue: streetlight.voltage,
      unit: 'V',
      configuredThreshold: thresholds.overVoltageLimitV,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction: 'Inspect transformer tap, voltage regulator, or neutral conductor integrity.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  // 4. UNDERVOLTAGE FAULT
  if (streetlight.voltage > 0 && streetlight.voltage < thresholds.underVoltageLimitV) {
    faults.push({
      id: `FLT-UV-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'UNDERVOLTAGE',
      severity: 'WARNING',
      description: `Line voltage sag detected: ${streetlight.voltage.toFixed(1)}V (minimum: ${thresholds.underVoltageLimitV}V).`,
      measuredValue: streetlight.voltage,
      unit: 'V',
      configuredThreshold: thresholds.underVoltageLimitV,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction: 'Inspect line drop, high impedance joints, and grid feeder load.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  // 5. DAYTIME LIGHT ON FAULT
  // Ambient light reading indicates broad daylight (e.g. > 450 lux), but the lamp is ON
  if (streetlight.state === 'ON' && ambientLightLux > thresholds.daylightThresholdLux) {
    faults.push({
      id: `FLT-DAY-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'DAYTIME_LIGHT_ON',
      severity: 'WARNING',
      description: `Energy waste alert: Streetlight is ON during daylight conditions (ambient light: ${Math.round(ambientLightLux)} Lux, threshold: ${thresholds.daylightThresholdLux} Lux).`,
      measuredValue: ambientLightLux,
      unit: 'Lux',
      configuredThreshold: thresholds.daylightThresholdLux,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction: 'Switch to Automatic LDR mode or adjust manual override schedule.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  // 6. SENSOR ERROR
  if (streetlight.current < -0.05 || streetlight.voltage < -0.5) {
    faults.push({
      id: `FLT-SNS-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'SENSOR_ERROR',
      severity: 'WARNING',
      description: `Erratic sensor reading: Voltage=${streetlight.voltage.toFixed(1)}V, Current=${streetlight.current.toFixed(2)}A`,
      measuredValue: streetlight.current,
      unit: 'A',
      configuredThreshold: 0,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction: 'Recalibrate ACS712 / SCT-013 current sensor offset and check analog ADC reference.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  return faults;
}

/**
 * Controller heartbeat & communication monitoring
 */
export function checkControllerHealth(
  controller: Controller,
  thresholds: FaultThresholds = DEFAULT_THRESHOLDS
): { isOffline: boolean; fault?: FaultRecord } {
  const lastHb = new Date(controller.lastHeartbeat).getTime();
  const now = Date.now();
  const diffSeconds = (now - lastHb) / 1000;

  if (diffSeconds > thresholds.controllerTimeoutSeconds) {
    return {
      isOffline: true,
      fault: {
        id: `FLT-OFFLINE-${controller.id}-${Date.now()}`,
        controllerId: controller.id,
        category: 'CONTROLLER_OFFLINE',
        severity: 'CRITICAL',
        description: `Heartbeat timeout: Controller ${controller.id} has not responded for ${Math.round(diffSeconds)}s (timeout: ${thresholds.controllerTimeoutSeconds}s).`,
        measuredValue: Math.round(diffSeconds),
        unit: 's',
        configuredThreshold: thresholds.controllerTimeoutSeconds,
        timestamp: new Date().toISOString(),
        status: 'UNACKNOWLEDGED',
        recommendedAction: 'Inspect ESP32 power supply, local Wi-Fi router / cellular gateway, and MQTT broker connection.',
        isSimulated: controller.isSimulated,
      },
    };
  }

  return { isOffline: false };
}

