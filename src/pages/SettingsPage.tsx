import React, { useState } from 'react';
import { useCCMS } from '../context/CCMSContext';
import { useAuth } from '../context/AuthContext';
import { FaultThresholds } from '../types/fault';
import { getSupabaseStatus } from '../services/supabaseClient';
import {
  Sliders,
  Shield,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lock,
  User,
  Radio,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { thresholds, updateThresholds, resetAllData, appMode, setAppMode } = useCCMS();
  const { user, isAdmin } = useAuth();

  const [formThresholds, setFormThresholds] = useState<FaultThresholds>(thresholds);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const supabaseStatus = getSupabaseStatus();

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(formThresholds);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (
      confirm(
        'Are you sure you want to restore the entire municipal database to default initial state? This resets all simulated faults and readings.'
      )
    ) {
      resetAllData();
      alert('System restored to standard initial state.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Notification */}
      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-3 text-xs text-emerald-300 flex items-center gap-2 font-medium">
          <CheckCircle className="h-4 w-4" />
          <span>Configured safety thresholds updated and deployed to fault detection engine.</span>
        </div>
      )}

      {/* Grid: 1. Thresholds Tuning + 2. System Security & Database */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Fault Engine Threshold Configuration */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                Electrical Fault Detection & Algorithmic Thresholds
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust safety parameters for current sensors, line voltages, and ambient light logic
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Real-time Active
            </span>
          </div>

          <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Open-Circuit Minimum Current (A)
                </label>
                <input
                  type="number"
                  step="0.005"
                  value={formThresholds.openCircuitMinCurrentA}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      openCircuitMinCurrentA: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Raises alarm if lamp is commanded ON but current remains below this value.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Overcurrent / Short Safety Limit (A)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formThresholds.overCurrentLimitA}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      overCurrentLimitA: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Hardware cutoff & critical alarm limit (0.45A for LED prototype).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Undervoltage Limit (V)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formThresholds.underVoltageLimitV}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      underVoltageLimitV: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Triggers line voltage sag warning (4.2V prototype DC / 195V AC).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Overvoltage Spike Limit (V)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formThresholds.overVoltageLimitV}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      overVoltageLimitV: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Triggers grid surge warning (5.6V prototype DC / 255V AC).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Daylight LDR Lux Threshold
                </label>
                <input
                  type="number"
                  step="10"
                  value={formThresholds.daylightThresholdLux}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      daylightThresholdLux: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Ambient light level above which lamps turn OFF in auto mode (default: 450 Lux).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Controller Heartbeat Timeout (s)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formThresholds.controllerTimeoutSeconds}
                  onChange={(e) =>
                    setFormThresholds({
                      ...formThresholds,
                      controllerTimeoutSeconds: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Seconds without ESP32 telemetry before flagging offline (default: 35s).
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 font-bold text-slate-950 text-xs shadow-glow-cyan transition-all"
              >
                Apply Threshold Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Backend Status & Security */}
        <div className="space-y-6">
          {/* User Session Details */}
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-cyan-400" />
              Authenticated Session
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Operator:</span>
                <span className="text-white font-semibold">{user?.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-300 font-mono">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Role:</span>
                <span className="text-cyan-400 font-mono font-bold capitalize">
                  {user?.role}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Organization:</span>
                <span className="text-slate-300">Gandhidham Municipal Corp</span>
              </div>
            </div>
          </div>

          {/* Database / Supabase Status */}
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-cyan-400" />
              Database & Cloud Sync
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Backend Provider:</span>
                <span className="font-semibold text-white">Supabase / PostgreSQL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connection Status:</span>
                <span
                  className={`font-mono font-bold ${
                    supabaseStatus.configured ? 'text-emerald-400' : 'text-cyan-400'
                  }`}
                >
                  {supabaseStatus.configured ? 'CONNECTED' : 'LOCAL CACHE / DEMO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                {supabaseStatus.message}
              </p>
            </div>
          </div>

          {/* Danger / Reset Zone */}
          <div className="rounded-xl border border-rose-900/40 bg-rose-950/10 p-5 shadow-lg">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 text-rose-400" />
              System Calibration & Reset
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Reset cached telemetry, clear simulated fault flags, and reload initial demonstration streetlights.
            </p>
            <button
              onClick={handleResetData}
              className="w-full py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors"
            >
              Restore Initial State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

