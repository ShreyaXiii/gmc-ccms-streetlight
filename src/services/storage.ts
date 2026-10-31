import { Streetlight } from '../types/streetlight';
import { Controller } from '../types/controller';
import { FaultRecord, FaultThresholds, DEFAULT_THRESHOLDS } from '../types/fault';
import { MaintenanceTicket } from '../types/maintenance';
import { StoredUserAccount, UserRole } from '../types/auth';
import { INITIAL_DEMO_CONTROLLER, INITIAL_DEMO_FAULTS, INITIAL_DEMO_STREETLIGHTS, INITIAL_DEMO_TICKETS } from './demoSimulator';

const STORAGE_KEYS = {
  STREETLIGHTS: 'gmc_ccms_streetlights',
  CONTROLLERS: 'gmc_ccms_controllers',
  FAULTS: 'gmc_ccms_faults',
  TICKETS: 'gmc_ccms_tickets',
  THRESHOLDS: 'gmc_ccms_thresholds',
  APP_MODE: 'gmc_ccms_mode', // 'demo' | 'real'
  AUTH_USER: 'gmc_ccms_user_session',
  REGISTERED_USERS: 'gmc_ccms_registered_users',
};

// SHA-256 hash helper with salt using standard Web Crypto API
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '::GMC_SALT::' + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback simple deterministic hash if crypto.subtle is unavailable
  let hash = 0;
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

// Default seeded municipal accounts
const INITIAL_USERS: StoredUserAccount[] = [
  {
    id: 'USR-GMC-ADMIN-01',
    email: 'admin@gmc.gov.in',
    fullName: 'Municipal Commissioner / Admin',
    passwordHash: 'admin123',
    salt: 'gmc_salt_admin_2026',
    role: 'administrator',
    organization: 'Gandhidham Municipal Corporation',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'USR-GMC-OPERATOR-01',
    email: 'operator@gmc.gov.in',
    fullName: 'Shift Engineer (Zone 1)',
    passwordHash: 'operator123',
    salt: 'gmc_salt_operator_2026',
    role: 'operator',
    organization: 'Gandhidham Municipal Corporation',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

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

  getUsers(): StoredUserAccount[] {
    const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      const parsed: StoredUserAccount[] = JSON.parse(data);
      // Ensure initial demo admin and operator are always present
      INITIAL_USERS.forEach(initUser => {
        if (!parsed.some(u => u.email.toLowerCase() === initUser.email.toLowerCase())) {
          parsed.push(initUser);
        }
      });
      return parsed;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: StoredUserAccount[]) {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
  },

  addUser(user: StoredUserAccount) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },

  updateUserRole(email: string, newRole: UserRole): boolean {
    const users = this.getUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index === -1) return false;
    users[index].role = newRole;
    this.saveUsers(users);
    return true;
  },

  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.STREETLIGHTS);
    localStorage.removeItem(STORAGE_KEYS.CONTROLLERS);
    localStorage.removeItem(STORAGE_KEYS.FAULTS);
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.removeItem(STORAGE_KEYS.THRESHOLDS);
  }
};


