import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Streetlight, StreetlightInput, LightState } from '../types/streetlight';
import { Controller } from '../types/controller';
import { FaultRecord, FaultThresholds } from '../types/fault';
import { MaintenanceTicket } from '../types/maintenance';
import { storage } from '../services/storage';
import { evaluateStreetlightFaults, checkControllerHealth } from '../services/faultEngine';
import { getActiveIoTAdapter, realAdapter, demoAdapter, IoTConnectionStatus } from '../services/iotAdapter';
import { useAuth } from './AuthContext';
import { INITIAL_DEMO_STREETLIGHTS } from '../services/demoSimulator';

interface CCMSContextType {
  // State
  streetlights: Streetlight[];
  controllers: Controller[];
  faults: FaultRecord[];
  tickets: MaintenanceTicket[];
  thresholds: FaultThresholds;
  appMode: 'demo' | 'real';
  systemStatus: IoTConnectionStatus;
  lastTelemetryTime: string;
  ambientLightLux: number;
  
  // Actions
  toggleStreetlight: (id: string, desiredState?: LightState) => Promise<boolean>;
  setStreetlightMode: (id: string, mode: 'auto' | 'manual' | 'scheduled') => void;
  bulkControl: (state: LightState) => Promise<void>;
  addStreetlight: (input: StreetlightInput) => boolean;
  updateStreetlight: (id: string, updates: Partial<Streetlight>) => void;
  deleteStreetlight: (id: string) => boolean;
  
  // Faults & Maintenance
  acknowledgeFault: (faultId: string) => void;
  resolveFault: (faultId: string, notes?: string) => void;
  createMaintenanceTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateMaintenanceTicket: (id: string, updates: Partial<MaintenanceTicket>) => void;
  
  // Configuration & Simulation
  updateThresholds: (thresholds: FaultThresholds) => void;
  setAppMode: (mode: 'demo' | 'real') => void;
  simulateFaultCondition: (lightId: string, faultType: 'OPEN_CIRCUIT' | 'OVERCURRENT' | 'DAYTIME_ON' | 'RESTORE') => void;
  simulateControllerOffline: (offline: boolean) => void;
  setSimulatedAmbientLight: (lux: number) => void;
  resetAllData: () => void;
}

const CCMSContext = createContext<CCMSContextType | undefined>(undefined);

export const CCMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  
  const [appMode, setAppModeState] = useState<'demo' | 'real'>(() => storage.getAppMode());
  const [streetlights, setStreetlights] = useState<Streetlight[]>(() => {
    const currentMode = storage.getAppMode();
    const stored = storage.getStreetlights();
    if (currentMode === 'real') {
      // In Real IoT Mode, if no active telemetry is connected, initialize with zeros
      return stored.map(l => ({
        ...l,
        state: 'OFF' as LightState,
        voltage: 0.0,
        current: 0.0,
        power: 0.0,
        energyKWh: 0.0,
        ambientLight: 0,
        healthStatus: 'OFFLINE',
      }));
    }
    return stored;
  });
  const [controllers, setControllers] = useState<Controller[]>(() => storage.getControllers());
  const [faults, setFaults] = useState<FaultRecord[]>(() => storage.getFaults());
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => storage.getTickets());
  const [thresholds, setThresholds] = useState<FaultThresholds>(() => storage.getThresholds());
  const [ambientLightLux, setAmbientLightLux] = useState<number>(() => storage.getAppMode() === 'real' ? 0 : 85);
  const [lastTelemetryTime, setLastTelemetryTime] = useState<string>(new Date().toISOString());
  const [simulatedSwitchActive, setSimulatedSwitchActive] = useState<Record<string, boolean>>({});
  const [realSystemStatus, setRealSystemStatus] = useState<IoTConnectionStatus>('OFFLINE');

  // Keep a reference to latest streetlights for async callbacks
  const streetlightsRef = useRef(streetlights);
  useEffect(() => {
    streetlightsRef.current = streetlights;
  }, [streetlights]);

  // Sync to storage (only in demo mode, avoid writing zeros over demo config)
  useEffect(() => {
    if (appMode === 'demo') {
      storage.saveStreetlights(streetlights);
    }
  }, [streetlights, appMode]);

  useEffect(() => {
    storage.saveFaults(faults);
  }, [faults]);

  useEffect(() => {
    storage.saveControllers(controllers);
  }, [controllers]);

  useEffect(() => {
    storage.saveTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    storage.saveThresholds(thresholds);
  }, [thresholds]);

  // =========================================================================
  // MODE 1: DEMO SIMULATION LOOP (Runs ONLY when appMode === 'demo')
  // =========================================================================
  useEffect(() => {
    if (appMode !== 'demo') {
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().toISOString();
      setLastTelemetryTime(now);

      // Check primary controller
      const primaryController = controllers[0];
      if (primaryController) {
        const { isOffline, fault: offlineFault } = checkControllerHealth(primaryController, thresholds);
        if (isOffline && offlineFault) {
          setFaults(prev => {
            if (prev.some(f => f.category === 'CONTROLLER_OFFLINE' && f.status === 'UNACKNOWLEDGED')) {
              return prev;
            }
            return [offlineFault, ...prev];
          });
        }
      }

      // Update telemetry for each streetlight in DEMO MODE
      setStreetlights(prevLights => {
        return prevLights.map(light => {
          let calculatedState = light.state;
          if (light.controlMode === 'auto') {
            calculatedState = ambientLightLux < thresholds.daylightThresholdLux ? 'ON' : 'OFF';
          }

          let voltage = light.voltage;
          let current = light.current;

          if (calculatedState === 'ON') {
            if (!simulatedSwitchActive[light.id]) {
              voltage = 5.0 + (Math.sin(Date.now() / 10000) * 0.05);
              current = 0.14 + (Math.cos(Date.now() / 8000) * 0.008);
            }
          } else {
            voltage = 5.08 + (Math.random() * 0.03);
            current = 0.000;
          }

          const power = Number((voltage * current).toFixed(2));
          const energyKWh = Number((light.energyKWh + (power * (1 / 3600)) / 1000).toFixed(6));

          const updatedLight: Streetlight = {
            ...light,
            state: calculatedState,
            voltage: Number(voltage.toFixed(2)),
            current: Number(current.toFixed(3)),
            power,
            energyKWh,
            ambientLight: ambientLightLux,
            lastCommunication: now,
            updatedAt: now,
          };

          const newFaults = evaluateStreetlightFaults({
            streetlight: updatedLight,
            ambientLightLux,
            thresholds,
            simulatedFaultSwitch: simulatedSwitchActive[light.id] || false,
          });

          if (newFaults.length > 0) {
            updatedLight.healthStatus = newFaults.some(f => f.severity === 'CRITICAL') ? 'CRITICAL' : 'WARNING';
            updatedLight.lastFault = newFaults[0].description;
            updatedLight.lastFaultType = newFaults[0].category;
            updatedLight.lastFaultTime = newFaults[0].timestamp;

            setFaults(currentFaults => {
              const toAdd = newFaults.filter(nf =>
                !currentFaults.some(
                  cf => cf.lightId === nf.lightId && cf.category === nf.category && cf.status === 'UNACKNOWLEDGED'
                )
              );
              return [...toAdd, ...currentFaults];
            });
          } else {
            const hasExistingUnack = faults.some(f => f.lightId === updatedLight.id && f.status === 'UNACKNOWLEDGED');
            if (!hasExistingUnack) {
              updatedLight.healthStatus = 'HEALTHY';
            }
          }

          return updatedLight;
        });
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [appMode, ambientLightLux, thresholds, simulatedSwitchActive, controllers, faults]);

  // =========================================================================
  // MODE 2: REAL IoT MODE – TELEMETRY LISTENER & FRESHNESS WATCHDOG
  // =========================================================================
  useEffect(() => {
    if (appMode !== 'real') {
      return;
    }

    // 1. Subscribe to incoming telemetry packets from Real IoT Adapter
    const unsubscribe = realAdapter.subscribeTelemetry(packet => {
      const now = new Date().toISOString();
      setLastTelemetryTime(now);
      setRealSystemStatus('CONNECTED');
      setAmbientLightLux(packet.ambientLightLux);

      // Update controllers
      setControllers(prev =>
        prev.map(c =>
          c.id === packet.controllerId
            ? { ...c, status: 'ONLINE', lastHeartbeat: now, rssi: packet.rssi }
            : c
        )
      );

      // Map incoming physical telemetry samples to registered streetlights
      setStreetlights(prevLights => {
        return prevLights.map(light => {
          const sample = packet.lights.find(
            s => s.lightId === light.id || s.relayChannel === light.relayChannel
          );

          if (sample && light.hardwareStatus === 'physical') {
            const power = sample.powerW;
            const energyDelta = (power * (2 / 3600)) / 1000;
            const energyKWh = Number((light.energyKWh + energyDelta).toFixed(6));

            const updatedLight: Streetlight = {
              ...light,
              state: sample.relayState ? 'ON' : 'OFF',
              voltage: sample.voltageV,
              current: sample.currentA,
              power,
              energyKWh,
              ambientLight: packet.ambientLightLux,
              lastCommunication: now,
              updatedAt: now,
              healthStatus: sample.simulatedFaultInput ? 'CRITICAL' : 'HEALTHY',
            };

            return updatedLight;
          }

          // Virtual streetlights without physical channel have zero readings in Real IoT Mode
          return {
            ...light,
            voltage: 0.0,
            current: 0.0,
            power: 0.0,
            energyKWh: 0.0,
            ambientLight: packet.ambientLightLux,
          };
        });
      });
    });

    // 2. Watchdog timer: checks every 1 second for telemetry freshness
    const watchdogTimer = setInterval(() => {
      const isFresh = realAdapter.isTelemetryFresh();
      const currentStatus = realAdapter.getConnectionStatus();
      setRealSystemStatus(currentStatus);

      // IF NO FRESH TELEMETRY (<10s window) IS BEING RECEIVED FROM ESP32:
      // Zero out all numerical readings, show zero power, zero voltage, zero current, zero energy
      if (!isFresh) {
        setAmbientLightLux(0);
        setControllers(prev =>
          prev.map(c => ({
            ...c,
            status: 'OFFLINE',
          }))
        );

        setStreetlights(prev => {
          // If already zeroed, avoid unneeded state updates
          const isAlreadyZeroed = prev.every(
            l => l.voltage === 0 && l.current === 0 && l.power === 0 && l.energyKWh === 0
          );
          if (isAlreadyZeroed) return prev;

          return prev.map(light => ({
            ...light,
            state: 'OFF' as LightState,
            voltage: 0.0,
            current: 0.0,
            power: 0.0,
            energyKWh: 0.0,
            ambientLight: 0,
            healthStatus: 'OFFLINE',
          }));
        });
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(watchdogTimer);
    };
  }, [appMode]);

  // =========================================================================
  // APP MODE SWITCHER (DEMO vs REAL IoT)
  // =========================================================================
  const setAppMode = useCallback((mode: 'demo' | 'real') => {
    setAppModeState(mode);
    storage.setAppMode(mode);

    if (mode === 'real') {
      // Transitioning to REAL IoT Mode:
      // Zero out all sensor readings immediately and reset real adapter
      realAdapter.resetRealMode();
      setRealSystemStatus('WAITING');
      setAmbientLightLux(0);

      setControllers(prev =>
        prev.map(c => ({
          ...c,
          status: 'OFFLINE',
        }))
      );

      setStreetlights(prev =>
        prev.map(l => ({
          ...l,
          state: 'OFF' as LightState,
          voltage: 0.0,
          current: 0.0,
          power: 0.0,
          energyKWh: 0.0,
          ambientLight: 0,
          healthStatus: 'OFFLINE',
        }))
      );
    } else {
      // Transitioning back to DEMO MODE:
      // Restore simulated demonstration values
      const storedLights = storage.getStreetlights();
      setStreetlights(storedLights.length > 0 ? storedLights : INITIAL_DEMO_STREETLIGHTS);
      setControllers(storage.getControllers());
      setAmbientLightLux(85);
      setRealSystemStatus('OFFLINE');
    }
  }, []);

  // Compute overall systemStatus
  const systemStatus: IoTConnectionStatus = appMode === 'demo'
    ? 'DEMO_MODE'
    : realSystemStatus;

  // Command handling
  const toggleStreetlight = useCallback(async (id: string, desiredState?: LightState): Promise<boolean> => {
    const light = streetlights.find(l => l.id === id);
    if (!light) return false;

    const targetState: LightState = desiredState || (light.state === 'ON' ? 'OFF' : 'ON');
    const adapter = getActiveIoTAdapter();

    const cmd = await adapter.sendCommand({
      controllerId: light.controllerId,
      lightId: light.id,
      relayChannel: light.relayChannel || undefined,
      type: 'SET_STATE',
      payload: { state: targetState },
      operatorId: user?.email || 'operator',
    });

    if (cmd.status === 'COMPLETED' || cmd.status === 'ACKNOWLEDGED') {
      setStreetlights(prev =>
        prev.map(l =>
          l.id === id
            ? {
                ...l,
                state: targetState,
                controlMode: 'manual',
                current: targetState === 'ON' ? (appMode === 'real' ? l.current : 0.14) : 0.0,
                power: targetState === 'ON' ? (appMode === 'real' ? l.power : Number((l.voltage * 0.14).toFixed(2))) : 0.0,
                updatedAt: new Date().toISOString(),
              }
            : l
        )
      );
      return true;
    }
    return false;
  }, [streetlights, user, appMode]);

  const setStreetlightMode = useCallback((id: string, mode: 'auto' | 'manual' | 'scheduled') => {
    setStreetlights(prev =>
      prev.map(l => (l.id === id ? { ...l, controlMode: mode, updatedAt: new Date().toISOString() } : l))
    );
  }, []);

  const bulkControl = useCallback(async (state: LightState) => {
    for (const light of streetlights) {
      await toggleStreetlight(light.id, state);
    }
  }, [streetlights, toggleStreetlight]);

  // Protected Admin Add Streetlight
  const addStreetlight = useCallback((input: StreetlightInput): boolean => {
    if (!isAdmin) {
      console.warn('Unauthorized: Only administrators can add streetlights.');
      return false;
    }

    const count = streetlights.length + 1;
    const newId = `SL-GMC-${String(count).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newLight: Streetlight = {
      ...input,
      id: newId,
      state: 'OFF',
      healthStatus: 'HEALTHY',
      voltage: appMode === 'real' ? 0.0 : 5.0,
      current: 0.0,
      power: 0.0,
      energyKWh: 0.0,
      ambientLight: ambientLightLux,
      lastCommunication: now,
      monitoringEnabled: true,
      createdAt: now,
      updatedAt: now,
      isSimulated: appMode === 'demo',
    };

    setStreetlights(prev => [...prev, newLight]);
    return true;
  }, [streetlights, ambientLightLux, appMode, isAdmin]);

  // Protected Admin Update Streetlight
  const updateStreetlight = useCallback((id: string, updates: Partial<Streetlight>) => {
    if (!isAdmin) {
      console.warn('Unauthorized: Only administrators can modify streetlight configurations.');
      return;
    }

    setStreetlights(prev =>
      prev.map(l => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l))
    );
  }, [isAdmin]);

  // Protected Admin Delete Streetlight
  const deleteStreetlight = useCallback((id: string): boolean => {
    if (!isAdmin) {
      console.warn('Unauthorized: Only administrators can remove streetlights.');
      return false;
    }

    setStreetlights(prev => prev.filter(l => l.id !== id));
    return true;
  }, [isAdmin]);

  const acknowledgeFault = useCallback((faultId: string) => {
    setFaults(prev =>
      prev.map(f =>
        f.id === faultId
          ? {
              ...f,
              status: 'ACKNOWLEDGED',
              acknowledgedBy: user?.fullName || 'Operator',
              acknowledgedAt: new Date().toISOString(),
            }
          : f
      )
    );
  }, [user]);

  const resolveFault = useCallback((faultId: string, notes?: string) => {
    setFaults(prev =>
      prev.map(f =>
        f.id === faultId
          ? {
              ...f,
              status: 'RESOLVED',
              resolvedBy: user?.fullName || 'Operator',
              resolvedAt: new Date().toISOString(),
              notes: notes || f.notes,
            }
          : f
      )
    );
  }, [user]);

  const createMaintenanceTicket = useCallback((ticketData: Omit<MaintenanceTicket, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const newTicket: MaintenanceTicket = {
      ...ticketData,
      id: `TCK-${Date.now().toString().slice(-6)}`,
      createdBy: user?.fullName || 'Operator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTickets(prev => [newTicket, ...prev]);
  }, [user]);

  const updateMaintenanceTicket = useCallback((id: string, updates: Partial<MaintenanceTicket>) => {
    setTickets(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  }, []);

  // Protected Admin Update Thresholds
  const updateThresholds = useCallback((newThresholds: FaultThresholds) => {
    if (!isAdmin) {
      console.warn('Unauthorized: Only administrators can tune safety thresholds.');
      return;
    }
    setThresholds(newThresholds);
  }, [isAdmin]);

  // Demo Fault Simulation methods
  const simulateFaultCondition = useCallback((
    lightId: string,
    faultType: 'OPEN_CIRCUIT' | 'OVERCURRENT' | 'DAYTIME_ON' | 'RESTORE'
  ) => {
    if (appMode !== 'demo') return;

    setStreetlights(prev =>
      prev.map(l => {
        if (l.id !== lightId) return l;

        if (faultType === 'RESTORE') {
          setSimulatedSwitchActive(s => ({ ...s, [lightId]: false }));
          return {
            ...l,
            state: 'ON',
            voltage: 5.05,
            current: 0.14,
            power: 0.71,
            healthStatus: 'HEALTHY',
            lastFault: undefined,
          };
        }

        if (faultType === 'OPEN_CIRCUIT') {
          setSimulatedSwitchActive(s => ({ ...s, [lightId]: true }));
          return {
            ...l,
            state: 'ON',
            voltage: 5.08,
            current: 0.002,
            power: 0.01,
            healthStatus: 'CRITICAL',
          };
        }

        if (faultType === 'OVERCURRENT') {
          setSimulatedSwitchActive(s => ({ ...s, [lightId]: true }));
          return {
            ...l,
            state: 'ON',
            voltage: 4.88,
            current: 0.58,
            power: 2.83,
            healthStatus: 'CRITICAL',
          };
        }

        if (faultType === 'DAYTIME_ON') {
          setAmbientLightLux(650);
          return {
            ...l,
            state: 'ON',
            controlMode: 'manual',
            healthStatus: 'WARNING',
          };
        }

        return l;
      })
    );
  }, [appMode]);

  // Protected Admin Controller Simulation
  const simulateControllerOffline = useCallback((offline: boolean) => {
    if (!isAdmin) return;
    setControllers(prev =>
      prev.map(c => ({
        ...c,
        status: offline ? 'OFFLINE' : 'ONLINE',
        lastHeartbeat: offline
          ? new Date(Date.now() - 3600000).toISOString()
          : new Date().toISOString(),
      }))
    );
  }, [isAdmin]);

  const setSimulatedAmbientLight = useCallback((lux: number) => {
    if (appMode !== 'demo') return;
    setAmbientLightLux(lux);
  }, [appMode]);

  // Protected Admin Data Reset
  const resetAllData = useCallback(() => {
    if (!isAdmin) {
      console.warn('Unauthorized: Only administrators can restore database to defaults.');
      return;
    }
    storage.resetToDefaults();
    setStreetlights(storage.getStreetlights());
    setControllers(storage.getControllers());
    setFaults(storage.getFaults());
    setTickets(storage.getTickets());
    setThresholds(storage.getThresholds());
  }, [isAdmin]);

  return (
    <CCMSContext.Provider
      value={{
        streetlights,
        controllers,
        faults,
        tickets,
        thresholds,
        appMode,
        systemStatus,
        lastTelemetryTime,
        ambientLightLux,
        toggleStreetlight,
        setStreetlightMode,
        bulkControl,
        addStreetlight,
        updateStreetlight,
        deleteStreetlight,
        acknowledgeFault,
        resolveFault,
        createMaintenanceTicket,
        updateMaintenanceTicket,
        updateThresholds,
        setAppMode,
        simulateFaultCondition,
        simulateControllerOffline,
        setSimulatedAmbientLight,
        resetAllData,
      }}
    >
      {children}
    </CCMSContext.Provider>
  );
};

export const useCCMS = () => {
  const context = useContext(CCMSContext);
  if (!context) {
    throw new Error('useCCMS must be used within a CCMSProvider');
  }
  return context;
};


