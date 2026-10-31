import React from 'react';
import { Menu, Wifi, WifiOff, Bell, Sun, Moon, ToggleLeft, ToggleRight, Power } from 'lucide-react';
import { useCCMS } from '../../context/CCMSContext';
import { useAuth } from '../../context/AuthContext';
import { PageId } from './Sidebar';

interface HeaderProps {
  activePage: PageId;
  onOpenSidebar: () => void;
  onNavigateToFaults: () => void;
}

const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Municipal Central Control Room',
    subtitle: 'Live Telemetry, System Health & Ward Aggregation',
  },
  monitoring: {
    title: 'Real-Time Telemetry & Historical Trends',
    subtitle: 'Multi-parameter time-series electrical load monitoring',
  },
  streetlights: {
    title: 'Streetlight Registry & Actuation',
    subtitle: 'Relay channel mapping, coordinates & hardware status',
  },
  details: {
    title: 'Streetlight Detailed Diagnostics',
    subtitle: 'Individual lamp history, command log & health metrics',
  },
  map: {
    title: 'Gandhidham GIS Streetlight Map',
    subtitle: 'OpenStreetMap spatial layout & live status markers',
  },
  faults: {
    title: 'Fault Classification & Alert Center',
    subtitle: 'Automated open-circuit, short-circuit & daylight detection',
  },
  energy: {
    title: 'Energy Analytics & PGVCL Tariffs',
    subtitle: 'Numerical integration (kWh), costs & automated savings',
  },
  maintenance: {
    title: 'Maintenance Work-Orders & Field Tickets',
    subtitle: 'Technician assignment, repair logs & audit trails',
  },
  controllers: {
    title: 'ESP32 Controllers & MQTT IoT Gateway',
    subtitle: 'Relay channels 1-6 mapping, telemetry schemas & C++ firmware',
  },
  reports: {
    title: 'Municipal Audit & CSV Exports',
    subtitle: 'Downloadable operational logs & energy records',
  },
  settings: {
    title: 'Thresholds, Security & System Settings',
    subtitle: 'Configurable trip points, access control & Supabase auth',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onOpenSidebar,
  onNavigateToFaults,
}) => {
  const {
    systemStatus,
    lastTelemetryTime,
    appMode,
    setAppMode,
    faults,
    bulkControl,
    controllers,
  } = useCCMS();
  const { user } = useAuth();

  const unackFaults = faults.filter((f) => f.status === 'UNACKNOWLEDGED');
  const pageMeta = PAGE_TITLES[activePage] || PAGE_TITLES.overview;

  const handleBulk = async (state: 'ON' | 'OFF') => {
    if (confirm(`Are you sure you want to turn ${state} ALL registered streetlights?`)) {
      await bulkControl(state);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800/80 bg-[#0B1120]/95 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {pageMeta.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 font-medium">
            {pageMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Bulk Control Pill (Quick municipal action) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => handleBulk('ON')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded text-cyan-400 hover:bg-cyan-950/40 hover:text-cyan-300 transition-colors"
          >
            <Power className="h-3 w-3 text-cyan-400" />
            All ON
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => handleBulk('OFF')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          >
            <Power className="h-3 w-3 text-slate-500" />
            All OFF
          </button>
        </div>

        {/* ESP32 Heartbeat Indicator */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-1.5 text-xs">
          {appMode === 'real' ? (
            systemStatus === 'CONNECTED' ? (
              <>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-400">ESP32 Connected</span>
              </>
            ) : systemStatus === 'WAITING' ? (
              <>
                <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-semibold text-amber-400">Waiting for Data</span>
              </>
            ) : (
              <>
                <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                <span className="font-semibold text-rose-400">ESP32 Disconnected</span>
              </>
            )
          ) : (
            <>
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold text-cyan-400">DEMO RIG</span>
            </>
          )}

          <span className="hidden lg:inline text-[11px] text-slate-500 font-mono">
            {new Date(lastTelemetryTime).toLocaleTimeString()}
          </span>
        </div>

        {/* Real vs Demo Mode Selector */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setAppMode('demo')}
            className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${appMode === 'demo'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            DEMO
          </button>
          <button
            onClick={() => setAppMode('real')}
            className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${appMode === 'real'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
              }`}
            title="Switch to Real ESP32 & MQTT broker mode"
          >
            REAL IoT
          </button>
        </div>

        {/* Active Fault Alert Bell */}
        <button
          onClick={onNavigateToFaults}
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={`${unackFaults.length} Unacknowledged Faults`}
        >
          <Bell className="h-5 w-5" />
          {unackFaults.length > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-glow-rose animate-ping">
              {unackFaults.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

