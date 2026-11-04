
import { FaultRecord, FaultThresholds, DEFAULT_THRESHOLDS } from '../types/fault';
import { Streetlight } from '../types/streetlight';
import { Controller } from '../types/controller';
import { MeasurementSource } from '../types/telemetry';

export interface DetectionInput {
  streetlight: Streetlight;
  ambientLightLux: number;
  thresholds?: FaultThresholds;
  simulatedFaultSwitch?: boolean;

  // When omitted, retain the existing Demo Mode behaviour.
  // Real IoT Mode must pass the actual telemetry measurement sources.
  currentSource?: MeasurementSource;
  voltageSource?: MeasurementSource;
  ambientLightSource?: MeasurementSource;
}

/**
 * Fault Detection Engine
 *
 * Supports Demo Mode and real sensor-aware IoT fault detection.
 * Missing sensor measurements are never treated as measured zero values.
 */
export function evaluateStreetlightFaults(input: DetectionInput): FaultRecord[] {
  const {
    streetlight,
    ambientLightLux,
    simulatedFaultSwitch = false,
  } = input;

  const thresholds = input.thresholds || DEFAULT_THRESHOLDS;
  const faults: FaultRecord[] = [];
  const now = new Date().toISOString();

  if (!streetlight.monitoringEnabled) {
    return [];
  }

  // Undefined source preserves legacy Demo Mode behaviour.
  const currentAvailable = input.currentSource !== 'unavailable';
  const voltageAvailable = input.voltageSource !== 'unavailable';
  const ambientLightAvailable =
    input.ambientLightSource !== 'unavailable';

  const measuredCurrent = currentAvailable
    ? streetlight.current
    : undefined;

  const measuredVoltage = voltageAvailable
    ? streetlight.voltage
    : undefined;

  // 1. OVERCURRENT / SIMULATED SHORT-CIRCUIT
  if (
    simulatedFaultSwitch ||
    (measuredCurrent !== undefined &&
      measuredCurrent > thresholds.overCurrentLimitA)
  ) {
    const isMeasuredOvercurrent =
      !simulatedFaultSwitch && measuredCurrent !== undefined;

    faults.push({
      id: `FLT-OC-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'SHORT_CIRCUIT_OR_OVERCURRENT',
      severity: 'CRITICAL',
      description: simulatedFaultSwitch
        ? `[SIMULATED] Fault switch triggered on relay channel ${streetlight.relayChannel || 'N/A'}.`
        : `Overcurrent detected: measured current ${measuredCurrent!.toFixed(3)}A exceeds the configured threshold of ${thresholds.overCurrentLimitA}A.`,
      measuredValue: isMeasuredOvercurrent
        ? measuredCurrent!
        : 0,
      unit: 'A',
      configuredThreshold: thresholds.overCurrentLimitA,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction:
        'Switch OFF the affected relay and inspect the LED, wiring, and current sensor. This alert does not automatically disconnect power.',
      isSimulated:
        simulatedFaultSwitch || streetlight.isSimulated || false,
    });
  }

  // 2. OPEN-CIRCUIT / LAMP NOT DRAWING CURRENT
  // Real IoT Mode can use measured current without a voltage sensor.
  if (
    streetlight.state === 'ON' &&
    measuredCurrent !== undefined &&
    measuredCurrent >= 0 &&
    measuredCurrent < thresholds.openCircuitMinCurrentA &&
    !simulatedFaultSwitch
  ) {
    faults.push({
      id: `FLT-OPEN-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'OPEN_CIRCUIT',
      severity: 'CRITICAL',
      description:
        `Possible open circuit: relay is ON, but measured current is ${measuredCurrent.toFixed(3)}A, below the configured minimum of ${thresholds.openCircuitMinCurrentA}A.`,
      measuredValue: measuredCurrent,
      unit: 'A',
      configuredThreshold: thresholds.openCircuitMinCurrentA,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction:
        'Inspect the LED, wiring connections, relay contacts, and current sensor. Confirm the fault before replacing components.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  // 3. OVERVOLTAGE — only when voltage is actually available
  if (
    measuredVoltage !== undefined &&
    measuredVoltage > thresholds.overVoltageLimitV
  ) {
    faults.push({
      id: `FLT-OV-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'OVERVOLTAGE',
      severity: 'WARNING',
      description:
        `High voltage detected: ${measuredVoltage.toFixed(2)}V (threshold: ${thresholds.overVoltageLimitV}V).`,
      measuredValue: measuredVoltage,
      unit: 'V',
      configuredThreshold: thresholds.overVoltageLimitV,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction:
        'Inspect the power supply and voltage measurement circuit.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  // 4. UNDERVOLTAGE — only when voltage is actually available
  if (
    measuredVoltage !== undefined &&
    measuredVoltage > 0 &&
    measuredVoltage < thresholds.underVoltageLimitV
  ) {
    faults.push({
      id: `FLT-UV-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'UNDERVOLTAGE',
      severity: 'WARNING',
      description:
        `Low voltage detected: ${measuredVoltage.toFixed(2)}V (minimum: ${thresholds.underVoltageLimitV}V).`,
      measuredValue: measuredVoltage,
      unit: 'V',
      configuredThreshold: thresholds.underVoltageLimitV,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction:
        'Inspect the power supply, wiring connections, and voltage measurement circuit.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  // 5. DAYTIME LIGHT ON — only when ambient light is available
  if (
    streetlight.state === 'ON' &&
    ambientLightAvailable &&
    ambientLightLux > thresholds.daylightThresholdLux
  ) {
    faults.push({
      id: `FLT-DAY-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'DAYTIME_LIGHT_ON',
      severity: 'WARNING',
      description:
        `Streetlight is ON during bright ambient conditions (${Math.round(ambientLightLux)} Lux; threshold: ${thresholds.daylightThresholdLux} Lux).`,
      measuredValue: ambientLightLux,
      unit: 'Lux',
      configuredThreshold: thresholds.daylightThresholdLux,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction:
        'Check the LDR sensor and automatic lighting schedule.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  // 6. SENSOR ERROR — check only measurements that are available
  const currentSensorError =
    measuredCurrent !== undefined && measuredCurrent < -0.05;

  const voltageSensorError =
    measuredVoltage !== undefined && measuredVoltage < -0.5;

  if (currentSensorError || voltageSensorError) {
    faults.push({
      id: `FLT-SNS-${streetlight.id}-${Date.now()}`,
      lightId: streetlight.id,
      lightName: streetlight.name,
      controllerId: streetlight.controllerId,
      category: 'SENSOR_ERROR',
      severity: 'WARNING',
      description:
        `Erratic sensor reading: ${currentSensorError ? `Current=${measuredCurrent!.toFixed(3)}A` : ''}${currentSensorError && voltageSensorError ? ', ' : ''}${voltageSensorError ? `Voltage=${measuredVoltage!.toFixed(2)}V` : ''}.`,
      measuredValue: currentSensorError
        ? measuredCurrent!
        : measuredVoltage!,
      unit: currentSensorError ? 'A' : 'V',
      configuredThreshold: 0,
      timestamp: now,
      status: 'UNACKNOWLEDGED',
      recommendedAction:
        'Inspect sensor wiring, calibration, ADC connections, and power supply.',
      isSimulated: streetlight.isSimulated || false,
    });
  }

  return faults;
}

/**
 * Controller heartbeat & communication monitoring.
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
        description:
          `Heartbeat timeout: Controller ${controller.id} has not responded for ${Math.round(diffSeconds)}s (timeout: ${thresholds.controllerTimeoutSeconds}s).`,
        measuredValue: Math.round(diffSeconds),
        unit: 's',
        configuredThreshold: thresholds.controllerTimeoutSeconds,
        timestamp: new Date().toISOString(),
        status: 'UNACKNOWLEDGED',
        recommendedAction:
          'Inspect ESP32 power, Wi-Fi connectivity, and controller communication.',
        isSimulated: controller.isSimulated,
      },
    };
  }

  return { isOffline: false };
}
