
import {
  DeviceCommand,
  ControllerTelemetryPacket,
  LightTelemetrySample,
} from '../types/telemetry';
import { storage } from './storage';

export type IoTConnectionStatus =
  | 'CONNECTED'
  | 'WAITING'
  | 'OFFLINE'
  | 'DEMO_MODE';

export interface IoTAdapter {
  mode: 'demo' | 'real';
  sendCommand(
    command: Omit<DeviceCommand, 'commandId' | 'timestamp' | 'status'>
  ): Promise<DeviceCommand>;
  subscribeTelemetry(
    callback: (packet: ControllerTelemetryPacket) => void
  ): () => void;
  getConnectionStatus(): IoTConnectionStatus;
  isTelemetryFresh?(): boolean;
  resetRealMode?(): void;
  feedRawTelemetry?(rawPacket: any): void;
}

/**
 * Demo adapter remains unchanged for local simulation.
 */
class DemoIoTAdapter implements IoTAdapter {
  mode: 'demo' = 'demo';
  private listeners: ((packet: ControllerTelemetryPacket) => void)[] = [];

  getConnectionStatus(): IoTConnectionStatus {
    return 'DEMO_MODE';
  }

  isTelemetryFresh(): boolean {
    return true;
  }

  async sendCommand(
    cmdData: Omit<DeviceCommand, 'commandId' | 'timestamp' | 'status'>
  ): Promise<DeviceCommand> {
    const commandId = `CMD-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`;
    const now = new Date().toISOString();

    const command: DeviceCommand = {
      ...cmdData,
      commandId,
      timestamp: now,
      status: 'PENDING',
    };

    await new Promise((resolve) => setTimeout(resolve, 300));
    command.status = 'ACKNOWLEDGED';
    command.acknowledgedAt = new Date().toISOString();

    await new Promise((resolve) => setTimeout(resolve, 400));

    if (command.lightId && command.payload.state) {
      const lights = storage.getStreetlights();
      const updated = lights.map((light) => {
        if (light.id === command.lightId) {
          const newState = command.payload.state!;
          const current =
            newState === 'ON' ? 0.138 + Math.random() * 0.01 : 0;

          return {
            ...light,
            state: newState,
            current,
            power: Number((light.voltage * current).toFixed(2)),
            updatedAt: new Date().toISOString(),
          };
        }
        return light;
      });

      storage.saveStreetlights(updated);
    }

    command.status = 'COMPLETED';
    command.completedAt = new Date().toISOString();
    return command;
  }

  subscribeTelemetry(
    callback: (packet: ControllerTelemetryPacket) => void
  ): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  emitTelemetry(packet: ControllerTelemetryPacket) {
    this.listeners.forEach((listener) => listener(packet));
  }
}

/**
 * Real adapter for the currently connected ESP32.
 * Only SL-GMC-001 / relay channel 1 is physically connected.
 */
class RealIoTAdapter implements IoTAdapter {
  mode: 'real' = 'real';
  private apiBaseUrl: string;
  private lastPacketTime = 0;
  private modeStartedAt = Date.now();
  private freshnessTimeoutMs = 10000;
  private listeners: ((packet: ControllerTelemetryPacket) => void)[] = [];
  private pollTimer: any = null;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_CCMS_API_BASE_URL || '/api/iot';
    this.initBridgeListener();
  }

  resetRealMode() {
    this.modeStartedAt = Date.now();
    this.lastPacketTime = 0;
  }

  isTelemetryFresh(): boolean {
    return (
      this.lastPacketTime !== 0 &&
      Date.now() - this.lastPacketTime < this.freshnessTimeoutMs
    );
  }

  getConnectionStatus(): IoTConnectionStatus {
    if (this.isTelemetryFresh()) return 'CONNECTED';

    if (
      this.lastPacketTime === 0 &&
      Date.now() - this.modeStartedAt < 6000
    ) {
      return 'WAITING';
    }

    return 'OFFLINE';
  }

  feedRawTelemetry(raw: any) {
    if (!raw) return;

    const controllerId = raw.controller_id || raw.controllerId;
    if (!controllerId) return;

    const rawLights: any[] = raw.lights || [];
    if (!Array.isArray(rawLights) || rawLights.length === 0) return;

    const parsedLights: LightTelemetrySample[] = rawLights.map(
      (light: any, index: number) => {
        const channel =
          light.relay_channel || light.relayChannel || index + 1;

        const lightId =
          light.light_id ||
          light.lightId ||
          `SL-GMC-${String(channel).padStart(3, '0')}`;

        const relayState = Boolean(
          light.relay_state !== undefined
            ? light.relay_state
            : light.relayState
        );

        const hasCurrent =
          typeof light.current_a === 'number' ||
          typeof light.currentA === 'number';

        const hasVoltage =
          typeof light.voltage_v === 'number' ||
          typeof light.voltageV === 'number';

        const currentA = hasCurrent
          ? (typeof light.current_a === 'number'
              ? light.current_a
              : light.currentA)
          : 0;

        const voltageV = hasVoltage
          ? (typeof light.voltage_v === 'number'
              ? light.voltage_v
              : light.voltageV)
          : 0;

        const powerW = Number((voltageV * currentA).toFixed(2));

        return {
          lightId,
          relayChannel: channel,
          relayState,
          currentA: Number(currentA.toFixed(3)),
          voltageV: Number(voltageV.toFixed(2)),
          powerW,
          currentSource: hasCurrent ? 'measured' : 'unavailable',
          voltageSource: hasVoltage ? 'measured' : 'unavailable',
          powerSource:
            hasCurrent && hasVoltage ? 'calculated' : 'unavailable',
          simulatedFaultInput: Boolean(light.simulated_fault),
        };
      }
    );

    const packet: ControllerTelemetryPacket = {
      controllerId,
      sequence: raw.sequence || 1,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      ambientLightLux:
        typeof raw.ambient_light === 'number'
          ? raw.ambient_light
          : typeof raw.ambientLightLux === 'number'
            ? raw.ambientLightLux
            : 0,
      lights: parsedLights,
      rssi: raw.wifi_rssi || raw.rssi,
      uptimeSeconds: raw.uptime_s || raw.uptimeSeconds,
      isSimulated: false,
    };

    this.lastPacketTime = Date.now();
    this.listeners.forEach((listener) => listener(packet));
  }

  private initBridgeListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('gmc_esp32_telemetry', (event: any) => {
        if (event.detail) this.feedRawTelemetry(event.detail);
      });
    }

    if (typeof window !== 'undefined' && !this.pollTimer) {
      this.pollTimer = setInterval(async () => {
        if (storage.getAppMode() !== 'real') return;

        try {
          const response = await fetch(`${this.apiBaseUrl}/telemetry`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(2000),
          });

          if (response.ok) {
            const data = await response.json();

            if (
              data &&
              (data.controller_id || data.controllerId) &&
              Array.isArray(data.lights)
            ) {
              this.feedRawTelemetry(data);
            }
          }
        } catch {
          // No telemetry endpoint is available until firmware supports it.
        }
      }, 3000);
    }
  }

  async sendCommand(
    cmdData: Omit<DeviceCommand, 'commandId' | 'timestamp' | 'status'>
  ): Promise<DeviceCommand> {
    const commandId = `CMD-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    const command: DeviceCommand = {
      ...cmdData,
      commandId,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
    };

    // Strictly prevent other lights from operating the single physical relay.
    if (
      command.type !== 'SET_STATE' ||
      command.controllerId !== 'ESP32-GMC-01' ||
      command.lightId !== 'SL-GMC-001' ||
      command.relayChannel !== 1 ||
      (command.payload.state !== 'ON' && command.payload.state !== 'OFF')
    ) {
      command.status = 'REJECTED';
      command.statusReason =
        'Only SL-GMC-001 on relay channel 1 is currently connected to the ESP32.';
      return command;
    }

    try {
      const endpoint =
        command.payload.state === 'ON' ? '/light/on' : '/light/off';

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (!response.ok) {
        throw new Error(`ESP32 communication failed: HTTP ${response.status}`);
      }

      const acknowledgement = await response.json();

      if (
        acknowledgement.success !== true ||
        acknowledgement.state !== command.payload.state
      ) {
        throw new Error('ESP32 did not confirm the requested relay state.');
      }

      command.status = 'COMPLETED';
      command.acknowledgedAt = new Date().toISOString();
      command.completedAt = new Date().toISOString();

      return command;
    } catch (error: any) {
      command.status = 'FAILED';
      command.statusReason =
        error?.message || 'Network error contacting ESP32 controller.';
      return command;
    }
  }

  subscribeTelemetry(
    callback: (packet: ControllerTelemetryPacket) => void
  ): () => void {
    this.listeners.push(callback);

    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }
}

export const demoAdapter = new DemoIoTAdapter();
export const realAdapter = new RealIoTAdapter();

export function getActiveIoTAdapter(): IoTAdapter {
  return storage.getAppMode() === 'real' ? realAdapter : demoAdapter;
}
