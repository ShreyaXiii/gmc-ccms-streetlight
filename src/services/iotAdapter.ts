import { DeviceCommand, CommandStatus, ControllerTelemetryPacket, LightTelemetrySample } from '../types/telemetry';
import { storage } from './storage';

export type IoTConnectionStatus = 'CONNECTED' | 'WAITING' | 'OFFLINE' | 'DEMO_MODE';

export interface IoTAdapter {
  mode: 'demo' | 'real';
  sendCommand(command: Omit<DeviceCommand, 'commandId' | 'timestamp' | 'status'>): Promise<DeviceCommand>;
  subscribeTelemetry(callback: (packet: ControllerTelemetryPacket) => void): () => void;
  getConnectionStatus(): IoTConnectionStatus;
  isTelemetryFresh?(): boolean;
  resetRealMode?(): void;
  feedRawTelemetry?(rawPacket: any): void;
}

/**
 * Demo IoT Adapter for local simulation & Hackathon presentations.
 * Simulates real network latency and controller acknowledgment handshake.
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

  async sendCommand(cmdData: Omit<DeviceCommand, 'commandId' | 'timestamp' | 'status'>): Promise<DeviceCommand> {
    const commandId = `CMD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const command: DeviceCommand = {
      ...cmdData,
      commandId,
      timestamp: now,
      status: 'PENDING',
    };

    // Simulate network delay to controller (300ms)
    await new Promise(r => setTimeout(r, 300));
    command.status = 'ACKNOWLEDGED';
    command.acknowledgedAt = new Date().toISOString();

    // Simulate physical relay actuation delay on ESP32 (400ms)
    await new Promise(r => setTimeout(r, 400));
    
    // In demo mode, apply state to local storage
    if (command.lightId && command.payload.state) {
      const lights = storage.getStreetlights();
      const updated = lights.map(l => {
        if (l.id === command.lightId) {
          const newState = command.payload.state!;
          const current = newState === 'ON' ? (0.138 + Math.random() * 0.01) : 0.00;
          return {
            ...l,
            state: newState,
            current,
            power: Number((l.voltage * current).toFixed(2)),
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      });
      storage.saveStreetlights(updated);
    }

    command.status = 'COMPLETED';
    command.completedAt = new Date().toISOString();
    return command;
  }

  subscribeTelemetry(callback: (packet: ControllerTelemetryPacket) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  emitTelemetry(packet: ControllerTelemetryPacket) {
    this.listeners.forEach(cb => cb(packet));
  }
}

/**
 * Real IoT Adapter for live ESP32 & MQTT broker bridge connection.
 * Strictly adheres to hardware telemetry validation and freshness timeout.
 * Zero numerical fallbacks are permitted when no physical ESP32 is transmitting.
 */
class RealIoTAdapter implements IoTAdapter {
  mode: 'real' = 'real';
  private apiBaseUrl: string;
  private lastPacketTime: number = 0; // 0 = no telemetry received yet
  private modeStartedAt: number = Date.now();
  private freshnessTimeoutMs: number = 10000; // 10 seconds freshness window
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
    if (this.lastPacketTime === 0) return false;
    return (Date.now() - this.lastPacketTime) < this.freshnessTimeoutMs;
  }

  getConnectionStatus(): IoTConnectionStatus {
    // 1. Fresh telemetry actively received
    if (this.isTelemetryFresh()) {
      return 'CONNECTED';
    }

    // 2. Just transitioned into Real IoT Mode and waiting for first heartbeat/packet
    if (this.lastPacketTime === 0 && (Date.now() - this.modeStartedAt) < 6000) {
      return 'WAITING';
    }

    // 3. Telemetry expired or physical ESP32 disconnected
    return 'OFFLINE';
  }

  feedRawTelemetry(raw: any) {
    if (!raw) return;

    // Validate structure: must contain controller id and lights
    const controllerId = raw.controller_id || raw.controllerId;
    if (!controllerId) return;

    const rawLights: any[] = raw.lights || [];
    if (!Array.isArray(rawLights) || rawLights.length === 0) return;

    const parsedLights: LightTelemetrySample[] = rawLights.map((l: any, idx: number) => {
      const channel = l.relay_channel || l.relayChannel || (idx + 1);
      const lightId = l.light_id || l.lightId || `SL-GMC-${String(channel).padStart(3, '0')}`;
      const relayState = Boolean(l.relay_state !== undefined ? l.relay_state : l.relayState);
      const currentA = typeof l.current_a === 'number' ? l.current_a : typeof l.currentA === 'number' ? l.currentA : 0.0;
      const voltageV = typeof l.voltage_v === 'number' ? l.voltage_v : typeof l.voltageV === 'number' ? l.voltageV : 0.0;
      const powerW = Number((voltageV * currentA).toFixed(2));

      return {
        lightId,
        relayChannel: channel,
        relayState,
        currentA: Number(currentA.toFixed(3)),
        voltageV: Number(voltageV.toFixed(2)),
        powerW,
        currentSource: 'measured',
        voltageSource: 'measured',
        powerSource: 'calculated',
        simulatedFaultInput: Boolean(l.simulated_fault),
      };
    });

    const packet: ControllerTelemetryPacket = {
      controllerId,
      sequence: raw.sequence || 1,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      ambientLightLux: typeof raw.ambient_light === 'number' ? raw.ambient_light : typeof raw.ambientLightLux === 'number' ? raw.ambientLightLux : 0,
      lights: parsedLights,
      rssi: raw.wifi_rssi || raw.rssi,
      uptimeSeconds: raw.uptime_s || raw.uptimeSeconds,
      isSimulated: false,
    };

    this.lastPacketTime = Date.now();
    this.listeners.forEach(cb => cb(packet));
  }

  private initBridgeListener() {
    // 1. Listen for browser window event bridge (useful for WebSerial, WebSocket client or external proxy)
    if (typeof window !== 'undefined') {
      window.addEventListener('gmc_esp32_telemetry', (e: any) => {
        if (e.detail) {
          this.feedRawTelemetry(e.detail);
        }
      });
    }

    // 2. Poll HTTP endpoint if configured
    if (typeof window !== 'undefined' && !this.pollTimer) {
      this.pollTimer = setInterval(async () => {
        const mode = storage.getAppMode();
        if (mode !== 'real') return;

        try {
          const res = await fetch(`${this.apiBaseUrl}/telemetry`, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(2000),
          });

          if (res.ok) {
            const data = await res.json();
            // Validate that actual telemetry payload exists and is fresh
            if (data && (data.controller_id || data.controllerId) && Array.isArray(data.lights)) {
              this.feedRawTelemetry(data);
            }
          }
        } catch {
          // Expected when no backend bridge or ESP32 is physically present
        }
      }, 3000);
    }
  }

  async sendCommand(cmdData: Omit<DeviceCommand, 'commandId' | 'timestamp' | 'status'>): Promise<DeviceCommand> {
    const commandId = `CMD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const command: DeviceCommand = {
      ...cmdData,
      commandId,
      timestamp: now,
      status: 'PENDING',
    };

    try {
      const res = await fetch(`${this.apiBaseUrl}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) {
        throw new Error(`Controller communication failed: ${res.statusText}`);
      }

      const ack = await res.json();
      return ack;
    } catch (err: any) {
      command.status = 'FAILED';
      command.statusReason = err.message || 'Network timeout contacting ESP32 controller';
      return command;
    }
  }

  subscribeTelemetry(callback: (packet: ControllerTelemetryPacket) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
}

export const demoAdapter = new DemoIoTAdapter();
export const realAdapter = new RealIoTAdapter();

export function getActiveIoTAdapter(): IoTAdapter {
  const mode = storage.getAppMode();
  return mode === 'real' ? realAdapter : demoAdapter;
}


