import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Streetlight, StreetlightInput, LightState } from '../types/streetlight';
import { Controller } from '../types/controller';
import { FaultRecord, FaultThresholds } from '../types/fault';
import { MaintenanceTicket } from '../types/maintenance';
import { storage } from '../services/storage';
import { evaluateStreetlightFaults, checkControllerHealth } from '../services/faultEngine';
import { getActiveIoTAdapter } from '../services/iotAdapter';
import { useAuth } from './AuthContext';

interface CCMSContextType {
  // State
  streetlights: Streetlight[];
  controllers: Controller[];
  faults: FaultRecord[];
  tickets: MaintenanceTicket[];
  thresholds: FaultThresholds;
  appMode: 'demo' | 'real';
  systemStatus: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE' | 'DEMO_MODE';
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
  const { user } = useAuth();
  
  const [streetlights, setStreetlights] = useState<Streetlight[]>(() => storage.getStreetlights());
  const [controllers, setControllers] = useState<Controller[]>(() => storage.getControllers());
  const [faults, setFaults] = useState<FaultRecord[]>(() => storage.getFaults());
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => storage.getTickets());
  const [thresholds, setThresholds] = useState<FaultThresholds>(() => storage.getThresholds());
  const [appMode, setAppModeState] = useState<'demo' | 'real'>(() => storage.getAppMode());
  const [ambientLightLux, setAmbientLightLux] = useState<number>(85);
  const [lastTelemetryTime, setLastTelemetryTime] = useState<string>(new Date().toISOString());
  const [simulatedSwitchActive, setSimulatedSwitchActive] = useState<Record<string, boolean>>({});

  // Sync to storage
  useEffect(() => {
    storage.saveStreetlights(streetlights);
  }, [streetlights]);

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

  // Periodic Telemetry Simulation & Fault Detection Loop
  useEffect(() => {
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

      // Update telemetry for each streetlight
      setStreetlights(prevLights => {
        return prevLights.map(light => {
          // If in automatic mode, obey LDR threshold
          let calculatedState = light.state;
          if (light.controlMode === 'auto') {
            calculatedState = ambientLightLux < thresholds.daylightThresholdLux ? 'ON' : 'OFF';
          }

          // Small natural electrical noise (e.g., +/- 0.02V, +/- 0.003A)
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
          // Increment energy slightly if on (1 second delta)
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

          // Run fault detection engine
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

            // Append to faults without duplicate spamming
            setFaults(currentFaults => {
              const toAdd = newFaults.filter(nf =>
                !currentFaults.some(
                  cf => cf.lightId === nf.lightId && cf.category === nf.category && cf.status === 'UNACKNOWLEDGED'
                )
              );
              return [...toAdd, ...currentFaults];
            });
          } else {
            // Restore health if no open faults
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
  }, [ambientLightLux, thresholds, simulatedSwitchActive, controllers, faults]);

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
                controlMode: 'manual', // explicit toggle enters manual mode
                current: targetState === 'ON' ? 0.14 : 0.0,
                power: targetState === 'ON' ? Number((l.voltage * 0.14).toFixed(2)) : 0.0,
                updatedAt: new Date().toISOString(),
              }
            : l
        )
      );
      return true;
    }
    return false;
  }, [streetlights, user]);

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

  const addStreetlight = useCallback((input: StreetlightInput): boolean => {
    // Generate sequential ID
    const count = streetlights.length + 1;
    const newId = `SL-GMC-${String(count).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newLight: Streetlight = {
      ...input,
      id: newId,
      state: 'OFF',
      healthStatus: 'HEALTHY',
      voltage: 5.0,
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
  }, [streetlights, ambientLightLux, appMode]);

  const updateStreetlight = useCallback((id: string, updates: Partial<Streetlight>) => {
    setStreetlights(prev =>
      prev.map(l => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l))
    );
  }, []);

  const deleteStreetlight = useCallback((id: string): boolean => {
    setStreetlights(prev => prev.filter(l => l.id !== id));
    return true;
  }, []);

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

  const updateThresholds = useCallback((newThresholds: FaultThresholds) => {
    setThresholds(newThresholds);
  }, []);

  const setAppMode = useCallback((mode: 'demo' | 'real') => {
    setAppModeState(mode);
    storage.setAppMode(mode);
  }, []);

  // Demo Fault Simulation methods
  const simulateFaultCondition = useCallback((
    lightId: string,
    faultType: 'OPEN_CIRCUIT' | 'OVERCURRENT' | 'DAYTIME_ON' | 'RESTORE'
  ) => {
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
            current: 0.002, // Near-zero current despite ON command
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
            current: 0.58, // Critical overcurrent > 0.45A
            power: 2.83,
            healthStatus: 'CRITICAL',
          };
        }

        if (faultType === 'DAYTIME_ON') {
          setAmbientLightLux(650); // Daylight condition
          return {
            ...l,
            state: 'ON',
            controlMode: 'manual', // Force ON during daylight
            healthStatus: 'WARNING',
          };
        }

        return l;
      })
    );
  }, []);

  const simulateControllerOffline = useCallback((offline: boolean) => {
    setControllers(prev =>
      prev.map(c => ({
        ...c,
        status: offline ? 'OFFLINE' : 'ONLINE',
        lastHeartbeat: offline
          ? new Date(Date.now() - 3600000).toISOString()
          : new Date().toISOString(),
      }))
    );
  }, []);

  const setSimulatedAmbientLight = useCallback((lux: number) => {
    setAmbientLightLux(lux);
  }, []);

  const resetAllData = useCallback(() => {
    storage.resetToDefaults();
    setStreetlights(storage.getStreetlights());
    setControllers(storage.getControllers());
    setFaults(storage.getFaults());
    setTickets(storage.getTickets());
    setThresholds(storage.getThresholds());
  }, []);

  const systemStatus = appMode === 'demo'
    ? 'DEMO_MODE'
    : controllers[0]?.status === 'ONLINE'
    ? 'CONNECTED'
    : 'OFFLINE';

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

