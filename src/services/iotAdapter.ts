import { DeviceCommand, CommandStatus, ControllerTelemetryPacket } from '../types/telemetry';
import { storage } from './storage';

export interface IoTAdapter {
  mode: 'demo' | 'real';
  sendCommand(command: Omit<DeviceCommand, 'commandId' | 'timestamp' | 'status'>): Promise<DeviceCommand>;
  subscribeTelemetry(callback: (packet: ControllerTelemetryPacket) => void): () => void;
  getConnectionStatus(): 'CONNECTED' | 'RECONNECTING' | 'OFFLINE' | 'DEMO_MODE';
}

/**
 * Demo IoT Adapter for local simulation & Hackathon presentations.
 * Simulates real network latency and controller acknowledgment handshake.
 */
class DemoIoTAdapter implements IoTAdapter {
  mode: 'demo' = 'demo';
  private listeners: ((packet: ControllerTelemetryPacket) => void)[] = [];

  getConnectionStatus(): 'CONNECTED' | 'RECONNECTING' | 'OFFLINE' | 'DEMO_MODE' {
    return 'DEMO_MODE';
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
 * Real IoT Adapter for live ESP32 & MQTT broker bridge connection
 */
class RealIoTAdapter implements IoTAdapter {
  mode: 'real' = 'real';
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_CCMS_API_BASE_URL || '/api/iot';
  }

  getConnectionStatus(): 'CONNECTED' | 'RECONNECTING' | 'OFFLINE' | 'DEMO_MODE' {
    return 'RECONNECTING'; // Real connection requires active backend bridge
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
      });

      if (!res.ok) {
        throw new Error(`Controller communication failed: ${res.statusText}`);
      }

      const ack = await res.json();
      return ack;
    } catch (err: any) {
      command.status = 'FAILED';
      command.statusReason = err.message || 'Network timeout contacting controller';
      return command;
    }
  }

  subscribeTelemetry(callback: (packet: ControllerTelemetryPacket) => void): () => void {
    // In production, connects via WebSocket or SSE to the persistent Node.js MQTT bridge
    return () => {};
  }
}

export const demoAdapter = new DemoIoTAdapter();
export const realAdapter = new RealIoTAdapter();

export function getActiveIoTAdapter(): IoTAdapter {
  const mode = storage.getAppMode();
  return mode === 'real' ? realAdapter : demoAdapter;
}

