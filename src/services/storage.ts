import { Streetlight } from '../types/streetlight';
import { Controller } from '../types/controller';
import { FaultRecord, FaultThresholds, DEFAULT_THRESHOLDS } from '../types/fault';
import { MaintenanceTicket } from '../types/maintenance';
import { INITIAL_DEMO_CONTROLLER, INITIAL_DEMO_FAULTS, INITIAL_DEMO_STREETLIGHTS, INITIAL_DEMO_TICKETS } from './demoSimulator';

const STORAGE_KEYS = {
  STREETLIGHTS: 'gmc_ccms_streetlights',
  CONTROLLERS: 'gmc_ccms_controllers',
  FAULTS: 'gmc_ccms_faults',
  TICKETS: 'gmc_ccms_tickets',
  THRESHOLDS: 'gmc_ccms_thresholds',
  APP_MODE: 'gmc_ccms_mode', // 'demo' | 'real'
  AUTH_USER: 'gmc_ccms_auth_user',
};

export const storage = {
  getStreetlights(): Streetlight[] {
    const data = localStorage.getItem(STORAGE_KEYS.STREETLIGHTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.STREETLIGHTS, JSON.stringify(INITIAL_DEMO_STREETLIGHTS));
      return INITIAL_DEMO_STREETLIGHTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_DEMO_STREETLIGHTS;
    }
  },

  saveStreetlights(lights: Streetlight[]) {
    localStorage.setItem(STORAGE_KEYS.STREETLIGHTS, JSON.stringify(lights));
  },

  getControllers(): Controller[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONTROLLERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CONTROLLERS, JSON.stringify([INITIAL_DEMO_CONTROLLER]));
      return [INITIAL_DEMO_CONTROLLER];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [INITIAL_DEMO_CONTROLLER];
    }
  },

  saveControllers(controllers: Controller[]) {
    localStorage.setItem(STORAGE_KEYS.CONTROLLERS, JSON.stringify(controllers));
  },

  getFaults(): FaultRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.FAULTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.FAULTS, JSON.stringify(INITIAL_DEMO_FAULTS));
      return INITIAL_DEMO_FAULTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_DEMO_FAULTS;
    }
  },

  saveFaults(faults: FaultRecord[]) {
    localStorage.setItem(STORAGE_KEYS.FAULTS, JSON.stringify(faults));
  },

  getTickets(): MaintenanceTicket[] {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_DEMO_TICKETS));
      return INITIAL_DEMO_TICKETS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_DEMO_TICKETS;
    }
  },

  saveTickets(tickets: MaintenanceTicket[]) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },

  getThresholds(): FaultThresholds {
    const data = localStorage.getItem(STORAGE_KEYS.THRESHOLDS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(DEFAULT_THRESHOLDS));
      return DEFAULT_THRESHOLDS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  },

  saveThresholds(thresholds: FaultThresholds) {
    localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(thresholds));
  },

  getAppMode(): 'demo' | 'real' {
    return (localStorage.getItem(STORAGE_KEYS.APP_MODE) as 'demo' | 'real') || 'demo';
  },

  setAppMode(mode: 'demo' | 'real') {
    localStorage.setItem(STORAGE_KEYS.APP_MODE, mode);
  },

  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.STREETLIGHTS);
    localStorage.removeItem(STORAGE_KEYS.CONTROLLERS);
    localStorage.removeItem(STORAGE_KEYS.FAULTS);
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.removeItem(STORAGE_KEYS.THRESHOLDS);
  }
};

