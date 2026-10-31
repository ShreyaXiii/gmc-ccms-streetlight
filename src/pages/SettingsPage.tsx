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
  UserCheck,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { thresholds, updateThresholds, resetAllData, appMode, setAppMode } = useCCMS();
  const { user, isAdmin, promoteUser, createAdminAccount, getUsersList } = useAuth();

  const [formThresholds, setFormThresholds] = useState<FaultThresholds>(thresholds);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User management state
  const [usersList, setUsersList] = useState(() => (getUsersList ? getUsersList() : []));
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  const supabaseStatus = getSupabaseStatus();

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(formThresholds);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRoleToggle = (targetEmail: string, currentRole: string) => {
    const targetRole = currentRole === 'administrator' ? 'operator' : 'administrator';
    if (
      confirm(
        `Are you sure you want to change role for ${targetEmail} from ${currentRole} to ${targetRole}?`
      )
    ) {
      const res = promoteUser(targetEmail, targetRole);
      if (res.success) {
        setUserActionMsg({ type: 'success', text: res.message });
        setUsersList(getUsersList());
      } else {
        setUserActionMsg({ type: 'error', text: res.message });
      }
      setTimeout(() => setUserActionMsg(null), 4000);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail || !newAdminPass) return;

    const res = await createAdminAccount(newAdminName, newAdminEmail, newAdminPass);
    if (res.success) {
      setUserActionMsg({ type: 'success', text: `Authorized administrator account created for ${newAdminEmail}.` });
      setUsersList(getUsersList());
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPass('');
      setShowAddAdminModal(false);
    } else {
      setUserActionMsg({ type: 'error', text: res.error || 'Failed to authorize administrator.' });
    }
    setTimeout(() => setUserActionMsg(null), 4000);
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

      {/* User Action Notification */}
      {userActionMsg && (
        <div
          className={`rounded-lg p-3 text-xs flex items-center gap-2 font-medium ${
            userActionMsg.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
          }`}
        >
          {userActionMsg.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{userActionMsg.text}</span>
        </div>
      )}

      {/* Grid: 1. Thresholds Tuning + 2. System Security & Database */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Fault Engine Threshold Configuration & User Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg">
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
                    Triggers immediate emergency relay cut-off if sensor current exceeds this limit.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Daylight Auto Threshold (Lux)
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

          {/* User Management & Role Authorization Panel (Admin Only) */}
          {isAdmin && (
            <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-cyan-400" />
                    Municipal User Management & Administrator Authorization
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authorized administrators can promote field operators or commission administrator accounts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Authorize Admin
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B1120] text-slate-400 border-b border-slate-800 uppercase text-[10px] font-mono">
                    <tr>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Assigned Role</th>
                      <th className="py-2.5 px-3 text-right">Access Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {usersList.map((u) => {
                      const isRootAdmin = u.email.toLowerCase() === 'admin@gmc.gov.in';
                      return (
                        <tr key={u.id} className="hover:bg-slate-900/50">
                          <td className="py-2.5 px-3 font-semibold text-white">{u.fullName}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">{u.email}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold capitalize ${
                                u.role === 'administrator'
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isRootAdmin ? (
                              <span className="text-[10px] text-slate-500 font-mono">Primary Root Admin</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRoleToggle(u.email, u.role)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                  u.role === 'operator'
                                    ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40'
                                    : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                                }`}
                              >
                                {u.role === 'operator' ? 'Promote to Admin' : 'Set to Operator'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

          {/* Danger / Reset Zone (Admin Only) */}
          {isAdmin && (
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
          )}
        </div>
      </div>

      {/* Modal: Authorize New Administrator */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-400" />
              Authorize New Administrator
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Create an administrator account with full municipal control room permissions
            </p>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Senior Municipal Engineer"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Official Email Address</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="engineer.lead@gmc.gov.in"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Authorize Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
