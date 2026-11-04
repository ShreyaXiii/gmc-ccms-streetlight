import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  Streetlight,
  StreetlightInput,
  LightState,
} from '../types/streetlight';

import { Controller } from '../types/controller';
import { FaultRecord, FaultThresholds } from '../types/fault';
import { MaintenanceTicket } from '../types/maintenance';

import { storage } from '../services/storage';

import {
  evaluateStreetlightFaults,
  checkControllerHealth,
} from '../services/faultEngine';

import {
  getActiveIoTAdapter,
  realAdapter,
  demoAdapter,
  IoTConnectionStatus,
} from '../services/iotAdapter';

import { useAuth } from './AuthContext';
import { INITIAL_DEMO_STREETLIGHTS } from '../services/demoSimulator';

interface CCMSContextType {
  streetlights: Streetlight[];
  controllers: Controller[];
  faults: FaultRecord[];
  tickets: MaintenanceTicket[];
  thresholds: FaultThresholds;
  appMode: 'demo' | 'real';
  systemStatus: IoTConnectionStatus;
  lastTelemetryTime: string;
  ambientLightLux: number;

  toggleStreetlight: (
    id: string,
    desiredState?: LightState
  ) => Promise<boolean>;

  setStreetlightMode: (
    id: string,
    mode: 'auto' | 'manual' | 'scheduled'
  ) => void;

  bulkControl: (state: LightState) => Promise<void>;
  addStreetlight: (input: StreetlightInput) => boolean;
  updateStreetlight: (id: string, updates: Partial<Streetlight>) => void;
  deleteStreetlight: (id: string) => boolean;

  acknowledgeFault: (faultId: string) => void;
  resolveFault: (faultId: string, notes?: string) => void;

  createMaintenanceTicket: (
    ticket: Omit<
      MaintenanceTicket,
      'id' | 'createdAt' | 'updatedAt' | 'createdBy'
    >
  ) => void;

  updateMaintenanceTicket: (
    id: string,
    updates: Partial<MaintenanceTicket>
  ) => void;

  updateThresholds: (thresholds: FaultThresholds) => void;
  setAppMode: (mode: 'demo' | 'real') => void;

  simulateFaultCondition: (
    lightId: string,
    faultType:
      | 'OPEN_CIRCUIT'
      | 'OVERCURRENT'
      | 'DAYTIME_ON'
      | 'RESTORE'
  ) => void;

  simulateControllerOffline: (offline: boolean) => void;
  setSimulatedAmbientLight: (lux: number) => void;
  resetAllData: () => void;
}

const CCMSContext = createContext<CCMSContextType | undefined>(undefined);

export const CCMSProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isAdmin } = useAuth();

  const [appMode, setAppModeState] = useState<'demo' | 'real'>(() =>
    storage.getAppMode()
  );

  const [streetlights, setStreetlights] = useState<Streetlight[]>(() => {
    const currentMode = storage.getAppMode();
    const stored = storage.getStreetlights();

    if (currentMode === 'real') {
      return stored.map(light => ({
        ...light,
        state: 'OFF' as LightState,
        voltage: 0,
        current: 0,
        power: 0,
        energyKWh: 0,
        ambientLight: 0,
        healthStatus: 'OFFLINE',
      }));
    }

    return stored;
  });

  const [controllers, setControllers] = useState<Controller[]>(() =>
    storage.getControllers()
  );

  const [faults, setFaults] = useState<FaultRecord[]>(() =>
    storage.getFaults()
  );

  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() =>
    storage.getTickets()
  );

  const [thresholds, setThresholds] = useState<FaultThresholds>(() =>
    storage.getThresholds()
  );

  const [ambientLightLux, setAmbientLightLux] = useState<number>(() =>
    storage.getAppMode() === 'real' ? 0 : 85
  );

  const [lastTelemetryTime, setLastTelemetryTime] = useState<string>(
    new Date().toISOString()
  );

  const [simulatedSwitchActive, setSimulatedSwitchActive] =
    useState<Record<string, boolean>>({});

  const [realSystemStatus, setRealSystemStatus] =
    useState<IoTConnectionStatus>('OFFLINE');

  // Keep the latest streetlight data available to telemetry callbacks.
  const streetlightsRef = useRef(streetlights);

  useEffect(() => {
    streetlightsRef.current = streetlights;
  }, [streetlights]);

  // Require consecutive real telemetry readings before raising a fault.
  const realFaultSampleCounts = useRef<Record<string, number>>({});

  // Persist existing application data.
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

  // ============================================================
  // DEMO MODE: SIMULATION AND FAULT DETECTION
  // ============================================================

  useEffect(() => {
    if (appMode !== 'demo') return;

    const timer = setInterval(() => {
      const now = new Date().toISOString();

      setLastTelemetryTime(now);

      const primaryController = controllers[0];

      if (primaryController) {
        const {
          isOffline,
          fault: offlineFault,
        } = checkControllerHealth(primaryController, thresholds);

        if (isOffline && offlineFault) {
          setFaults(prev => {
            const alreadyExists = prev.some(
              fault =>
                fault.category === 'CONTROLLER_OFFLINE' &&
                fault.status !== 'RESOLVED'
            );

            return alreadyExists
              ? prev
              : [offlineFault, ...prev];
          });
        }
      }

      setStreetlights(prevLights =>
        prevLights.map(light => {
          let calculatedState = light.state;

          if (light.controlMode === 'auto') {
            calculatedState =
              ambientLightLux < thresholds.daylightThresholdLux
                ? 'ON'
                : 'OFF';
          }

          let voltage = light.voltage;
          let current = light.current;

          if (calculatedState === 'ON') {
            if (!simulatedSwitchActive[light.id]) {
              voltage =
                5.0 + Math.sin(Date.now() / 10000) * 0.05;

              current =
                0.14 + Math.cos(Date.now() / 8000) * 0.008;
            }
          } else {
            voltage = 5.08 + Math.random() * 0.03;
            current = 0;
          }

          const power = Number((voltage * current).toFixed(2));

          const energyKWh = Number(
            (
              light.energyKWh +
              (power * (1 / 3600)) / 1000
            ).toFixed(6)
          );

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
            simulatedFaultSwitch:
              simulatedSwitchActive[light.id] || false,
          });

          if (newFaults.length > 0) {
            updatedLight.healthStatus = newFaults.some(
              fault => fault.severity === 'CRITICAL'
            )
              ? 'CRITICAL'
              : 'WARNING';

            updatedLight.lastFault = newFaults[0].description;
            updatedLight.lastFaultType = newFaults[0].category;
            updatedLight.lastFaultTime = newFaults[0].timestamp;

            setFaults(currentFaults => {
              const toAdd = newFaults.filter(newFault =>
                !currentFaults.some(
                  existing =>
                    existing.lightId === newFault.lightId &&
                    existing.category === newFault.category &&
                    existing.status !== 'RESOLVED'
                )
              );

              return [...toAdd, ...currentFaults];
            });
          } else {
            updatedLight.healthStatus = 'HEALTHY';
          }

          return updatedLight;
        })
      );
    }, 2000);

    return () => clearInterval(timer);
  }, [
    appMode,
    ambientLightLux,
    thresholds,
    simulatedSwitchActive,
    controllers,
  ]);

  // ============================================================
  // REAL IoT MODE: ESP32 TELEMETRY AND AUTOMATIC FAULT DETECTION
  // ============================================================

  useEffect(() => {
    if (appMode !== 'real') return;

    // Subscribe to ESP32 telemetry.
    const unsubscribe = realAdapter.subscribeTelemetry(packet => {
      const now = new Date().toISOString();

      setLastTelemetryTime(now);
      setRealSystemStatus('CONNECTED');
      setAmbientLightLux(packet.ambientLightLux);

      // Update controller heartbeat.
      setControllers(prev =>
        prev.map(controller =>
          controller.id === packet.controllerId
            ? {
                ...controller,
                status: 'ONLINE',
                lastHeartbeat: now,
                rssi: packet.rssi,
              }
            : controller
        )
      );

      const detectedFaults: FaultRecord[] = [];
      const confirmedCategories: Record<string, string[]> = {};

      // Evaluate only physical lights that have an actual ESP32 sample.
      const registeredLights = streetlightsRef.current;

      packet.lights.forEach(sample => {
        const light = registeredLights.find(
          registered =>
            registered.hardwareStatus === 'physical' &&
            (
              registered.id === sample.lightId ||
              registered.relayChannel === sample.relayChannel
            )
        );

        if (!light || !light.monitoringEnabled) return;

        const updatedLight: Streetlight = {
          ...light,
          state: sample.relayState ? 'ON' : 'OFF',
          voltage: sample.voltageV,
          current: sample.currentA,
          power: sample.powerW,
          ambientLight: packet.ambientLightLux,
          lastCommunication: now,
          updatedAt: now,
        };

        // Real mode has no confirmed LDR measurement yet.
        // Do not generate daytime-light alerts from a default zero value.
        const candidates = evaluateStreetlightFaults({
          streetlight: updatedLight,
          ambientLightLux: packet.ambientLightLux,
          thresholds,
          simulatedFaultSwitch: sample.simulatedFaultInput || false,
          currentSource: sample.currentSource,
          voltageSource: sample.voltageSource,
          ambientLightSource: 'unavailable',
        });

        const candidateKeys = new Set<string>();

        candidates.forEach(candidate => {
          const key = `${light.id}::${candidate.category}`;

          candidateKeys.add(key);

          const count =
            (realFaultSampleCounts.current[key] || 0) + 1;

          realFaultSampleCounts.current[key] = count;

          // Two consecutive telemetry packets are required.
          if (count >= 2) {
            detectedFaults.push(candidate);

            if (!confirmedCategories[light.id]) {
              confirmedCategories[light.id] = [];
            }

            confirmedCategories[light.id].push(
              candidate.category
            );
          }
        });

        // Reset counters for conditions that are no longer detected.
        Object.keys(realFaultSampleCounts.current).forEach(key => {
          if (
            key.startsWith(`${light.id}::`) &&
            !candidateKeys.has(key)
          ) {
            realFaultSampleCounts.current[key] = 0;
          }
        });
      });

      // Store new faults without duplicating existing active records.
      if (detectedFaults.length > 0) {
        setFaults(prev => {
          const newRecords = detectedFaults.filter(newFault => {
            return !prev.some(
              existing =>
                existing.lightId === newFault.lightId &&
                existing.category === newFault.category &&
                existing.status !== 'RESOLVED'
            );
          });

          return newRecords.length > 0
            ? [...newRecords, ...prev]
            : prev;
        });
      }

      // Update dashboard readings using the incoming ESP32 samples.
      setStreetlights(prevLights =>
        prevLights.map(light => {
          const sample = packet.lights.find(
            item =>
              item.lightId === light.id ||
              item.relayChannel === light.relayChannel
          );

          if (
            sample &&
            light.hardwareStatus === 'physical'
          ) {
            const power = sample.powerW;

            const energyDelta =
              (power * (2 / 3600)) / 1000;

            const energyKWh = Number(
              (light.energyKWh + energyDelta).toFixed(6)
            );

            const confirmedFaults =
              confirmedCategories[light.id] || [];

            const hasCriticalFault = confirmedFaults.some(
              category =>
                category === 'OPEN_CIRCUIT' ||
                category === 'SHORT_CIRCUIT_OR_OVERCURRENT'
            );

            const hasWarningFault = confirmedFaults.length > 0;

            return {
              ...light,
              state: sample.relayState ? 'ON' : 'OFF',
              voltage: sample.voltageV,
              current: sample.currentA,
              power,
              energyKWh,
              ambientLight: packet.ambientLightLux,
              lastCommunication: now,
              updatedAt: now,
              healthStatus: hasCriticalFault
                ? 'CRITICAL'
                : hasWarningFault
                  ? 'WARNING'
                  : sample.simulatedFaultInput
                    ? 'CRITICAL'
                    : 'HEALTHY',
            };
          }

          // Do not show simulated readings for unconnected lights
          // in Real IoT Mode.
          return {
            ...light,
            voltage: 0,
            current: 0,
            power: 0,
            energyKWh: 0,
            ambientLight: packet.ambientLightLux,
          };
        })
      );
    });

    // Watchdog: check telemetry freshness every second.
    const watchdogTimer = setInterval(() => {
      const isFresh = realAdapter.isTelemetryFresh();
      const currentStatus = realAdapter.getConnectionStatus();

      setRealSystemStatus(currentStatus);

      if (!isFresh) {
        setAmbientLightLux(0);

        setControllers(prev =>
          prev.map(controller => ({
            ...controller,
            status: 'OFFLINE',
          }))
        );

        setStreetlights(prev => {
          const alreadyZeroed = prev.every(
            light =>
              light.voltage === 0 &&
              light.current === 0 &&
              light.power === 0 &&
              light.energyKWh === 0
          );

          if (alreadyZeroed) return prev;

          return prev.map(light => ({
            ...light,
            state: 'OFF' as LightState,
            voltage: 0,
            current: 0,
            power: 0,
            energyKWh: 0,
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
  }, [appMode, thresholds]);

  // ============================================================
  // APP MODE SWITCHER
  // ============================================================

  const setAppMode = useCallback((mode: 'demo' | 'real') => {
    setAppModeState(mode);
    storage.setAppMode(mode);

    // Reset debounce history when changing modes.
    realFaultSampleCounts.current = {};

    if (mode === 'real') {
      realAdapter.resetRealMode();

      setRealSystemStatus('WAITING');
      setAmbientLightLux(0);

      setControllers(prev =>
        prev.map(controller => ({
          ...controller,
          status: 'OFFLINE',
        }))
      );

      setStreetlights(prev =>
        prev.map(light => ({
          ...light,
          state: 'OFF' as LightState,
          voltage: 0,
          current: 0,
          power: 0,
          energyKWh: 0,
          ambientLight: 0,
          healthStatus: 'OFFLINE',
        }))
      );
    } else {
      const storedLights = storage.getStreetlights();

      setStreetlights(
        storedLights.length > 0
          ? storedLights
          : INITIAL_DEMO_STREETLIGHTS
      );

      setControllers(storage.getControllers());
      setAmbientLightLux(85);
      setRealSystemStatus('OFFLINE');
    }
  }, []);

  const systemStatus: IoTConnectionStatus =
    appMode === 'demo'
      ? 'DEMO_MODE'
      : realSystemStatus;

  // ============================================================
  // STREETLIGHT CONTROL
  // ============================================================

  const toggleStreetlight = useCallback(
    async (
      id: string,
      desiredState?: LightState
    ): Promise<boolean> => {
      const light = streetlights.find(item => item.id === id);

      if (!light) return false;

      const targetState: LightState =
        desiredState ||
        (light.state === 'ON' ? 'OFF' : 'ON');

      const adapter = getActiveIoTAdapter();

      const command = await adapter.sendCommand({
        controllerId: light.controllerId,
        lightId: light.id,
        relayChannel: light.relayChannel || undefined,
        type: 'SET_STATE',
        payload: { state: targetState },
        operatorId: user?.email || 'operator',
      });

      if (
        command.status === 'COMPLETED' ||
        command.status === 'ACKNOWLEDGED'
      ) {
        setStreetlights(prev =>
          prev.map(item =>
            item.id === id
              ? {
                  ...item,
                  state: targetState,
                  controlMode: 'manual',
                  current:
                    targetState === 'ON'
                      ? appMode === 'real'
                        ? item.current
                        : 0.14
                      : 0,
                  power:
                    targetState === 'ON'
                      ? appMode === 'real'
                        ? item.power
                        : Number(
                            (item.voltage * 0.14).toFixed(2)
                          )
                      : 0,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );

        return true;
      }

      return false;
    },
    [streetlights, user, appMode]
  );

  const setStreetlightMode = useCallback(
    (
      id: string,
      mode: 'auto' | 'manual' | 'scheduled'
    ) => {
      setStreetlights(prev =>
        prev.map(light =>
          light.id === id
            ? {
                ...light,
                controlMode: mode,
                updatedAt: new Date().toISOString(),
              }
            : light
        )
      );
    },
    []
  );

  const bulkControl = useCallback(
    async (state: LightState) => {
      for (const light of streetlights) {
        await toggleStreetlight(light.id, state);
      }
    },
    [streetlights, toggleStreetlight]
  );

  // ============================================================
  // ADMIN: STREETLIGHT MANAGEMENT
  // ============================================================

  const addStreetlight = useCallback(
    (input: StreetlightInput): boolean => {
      if (!isAdmin) {
        console.warn(
          'Unauthorized: Only administrators can add streetlights.'
        );
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
        voltage: appMode === 'real' ? 0 : 5,
        current: 0,
        power: 0,
        energyKWh: 0,
        ambientLight: ambientLightLux,
        lastCommunication: now,
        monitoringEnabled: true,
        createdAt: now,
        updatedAt: now,
        isSimulated: appMode === 'demo',
      };

      setStreetlights(prev => [...prev, newLight]);

      return true;
    },
    [streetlights, ambientLightLux, appMode, isAdmin]
  );

  const updateStreetlight = useCallback(
    (id: string, updates: Partial<Streetlight>) => {
      if (!isAdmin) {
        console.warn(
          'Unauthorized: Only administrators can modify streetlight configurations.'
        );
        return;
      }

      setStreetlights(prev =>
        prev.map(light =>
          light.id === id
            ? {
                ...light,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : light
        )
      );
    },
    [isAdmin]
  );

  const deleteStreetlight = useCallback(
    (id: string): boolean => {
      if (!isAdmin) {
        console.warn(
          'Unauthorized: Only administrators can remove streetlights.'
        );
        return false;
      }

      setStreetlights(prev =>
        prev.filter(light => light.id !== id)
      );

      return true;
    },
    [isAdmin]
  );

  // ============================================================
  // FAULT ACKNOWLEDGEMENT AND RESOLUTION
  // ============================================================

  const acknowledgeFault = useCallback(
    (faultId: string) => {
      setFaults(prev =>
        prev.map(fault =>
          fault.id === faultId
            ? {
                ...fault,
                status: 'ACKNOWLEDGED',
                acknowledgedBy: user?.fullName || 'Operator',
                acknowledgedAt: new Date().toISOString(),
              }
            : fault
        )
      );
    },
    [user]
  );

  const resolveFault = useCallback(
    (faultId: string, notes?: string) => {
      setFaults(prev =>
        prev.map(fault =>
          fault.id === faultId
            ? {
                ...fault,
                status: 'RESOLVED',
                resolvedBy: user?.fullName || 'Operator',
                resolvedAt: new Date().toISOString(),
                notes: notes || fault.notes,
              }
            : fault
        )
      );
    },
    [user]
  );

  // ============================================================
  // MAINTENANCE TICKETS
  // ============================================================

  const createMaintenanceTicket = useCallback(
    (
      ticketData: Omit<
        MaintenanceTicket,
        'id' | 'createdAt' | 'updatedAt' | 'createdBy'
      >
    ) => {
      const now = new Date().toISOString();

      const newTicket: MaintenanceTicket = {
        ...ticketData,
        id: `TCK-${Date.now().toString().slice(-6)}`,
        createdBy: user?.fullName || 'Operator',
        createdAt: now,
        updatedAt: now,
      };

      setTickets(prev => [newTicket, ...prev]);
    },
    [user]
  );

  const updateMaintenanceTicket = useCallback(
    (id: string, updates: Partial<MaintenanceTicket>) => {
      setTickets(prev =>
        prev.map(ticket =>
          ticket.id === id
            ? {
                ...ticket,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : ticket
        )
      );
    },
    []
  );

  // ============================================================
  // ADMIN: THRESHOLD CONFIGURATION
  // ============================================================

  const updateThresholds = useCallback(
    (newThresholds: FaultThresholds) => {
      if (!isAdmin) {
        console.warn(
          'Unauthorized: Only administrators can tune safety thresholds.'
        );
        return;
      }

      setThresholds(newThresholds);
    },
    [isAdmin]
  );

  // ============================================================
  // DEMO FAULT SIMULATION
  // ============================================================

  const simulateFaultCondition = useCallback(
    (
      lightId: string,
      faultType:
        | 'OPEN_CIRCUIT'
        | 'OVERCURRENT'
        | 'DAYTIME_ON'
        | 'RESTORE'
    ) => {
      if (appMode !== 'demo') return;

      setStreetlights(prev =>
        prev.map(light => {
          if (light.id !== lightId) return light;

          if (faultType === 'RESTORE') {
            setSimulatedSwitchActive(current => ({
              ...current,
              [lightId]: false,
            }));

            return {
              ...light,
              state: 'ON',
              voltage: 5.05,
              current: 0.14,
              power: 0.71,
              healthStatus: 'HEALTHY',
              lastFault: undefined,
            };
          }

          if (faultType === 'OPEN_CIRCUIT') {
            setSimulatedSwitchActive(current => ({
              ...current,
              [lightId]: true,
            }));

            return {
              ...light,
              state: 'ON',
              voltage: 5.08,
              current: 0.002,
              power: 0.01,
              healthStatus: 'CRITICAL',
            };
          }

          if (faultType === 'OVERCURRENT') {
            setSimulatedSwitchActive(current => ({
              ...current,
              [lightId]: true,
            }));

            return {
              ...light,
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
              ...light,
              state: 'ON',
              controlMode: 'manual',
              healthStatus: 'WARNING',
            };
          }

          return light;
        })
      );
    },
    [appMode]
  );

  // ============================================================
  // ADMIN: CONTROLLER SIMULATION
  // ============================================================

  const simulateControllerOffline = useCallback(
    (offline: boolean) => {
      if (!isAdmin) return;

      setControllers(prev =>
        prev.map(controller => ({
          ...controller,
          status: offline ? 'OFFLINE' : 'ONLINE',
          lastHeartbeat: offline
            ? new Date(Date.now() - 3600000).toISOString()
            : new Date().toISOString(),
        }))
      );
    },
    [isAdmin]
  );

  const setSimulatedAmbientLight = useCallback(
    (lux: number) => {
      if (appMode !== 'demo') return;

      setAmbientLightLux(lux);
    },
    [appMode]
  );

  // ============================================================
  // ADMIN: RESET DATA
  // ============================================================

  const resetAllData = useCallback(() => {
    if (!isAdmin) {
      console.warn(
        'Unauthorized: Only administrators can restore database to defaults.'
      );
      return;
    }

    storage.resetToDefaults();

    setStreetlights(storage.getStreetlights());
    setControllers(storage.getControllers());
    setFaults(storage.getFaults());
    setTickets(storage.getTickets());
    setThresholds(storage.getThresholds());
  }, [isAdmin]);

  // ============================================================
  // CONTEXT PROVIDER
  // ============================================================

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
    throw new Error(
      'useCCMS must be used within a CCMSProvider'
    );
  }

  return context;
};
