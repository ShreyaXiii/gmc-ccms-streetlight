import React, { useState } from 'react';
import { useCCMS } from '../../context/CCMSContext';
import { Sun, Moon, AlertTriangle, Zap, WifiOff, RefreshCw, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export const DemoControlBar: React.FC = () => {
  const {
    appMode,
    ambientLightLux,
    setSimulatedAmbientLight,
    simulateFaultCondition,
    simulateControllerOffline,
    controllers,
    streetlights,
    resetAllData,
  } = useCCMS();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedLightId, setSelectedLightId] = useState<string>(streetlights[0]?.id || 'SL-GMC-001');

  if (appMode !== 'demo') {
    return null;
  }

  const isControllerOffline = controllers[0]?.status === 'OFFLINE';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950/80 border-b border-cyan-500/30 text-xs transition-all shadow-md">
      {/* Top Bar Summary Strip */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Hackathon IoT Hardware Simulation Rig
          </span>
          <span className="hidden sm:inline-block text-slate-400 text-[11px] border-l border-slate-700 pl-2">
            Safe Low-Voltage ESP32 Sensor & Relay Simulation
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            {ambientLightLux < 450 ? (
              <Moon className="h-3.5 w-3.5 text-blue-400" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className="text-slate-300 font-medium">Ambient LDR:</span>
            <span className="font-mono text-cyan-300 font-bold">{Math.round(ambientLightLux)} Lux</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/50 border border-cyan-500/30 transition-colors font-medium"
          >
            {isExpanded ? (
              <>
                <span>Hide Controls</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Test Sensors & Faults</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Hardware Controls */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/90 px-4 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* 1. LDR Ambient Light Slider */}
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  Simulate Ambient Light (LDR)
                </label>
                <span className="font-mono text-[11px] text-cyan-400">
                  {ambientLightLux < 450 ? '🌙 Night (<450 Lux)' : '☀️ Day (≥450 Lux)'}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="800"
                step="10"
                value={ambientLightLux}
                onChange={(e) => setSimulatedAmbientLight(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>10 Lux (Dark Night)</span>
                <span>450 Lux (Threshold)</span>
                <span>800 Lux (Bright Noon)</span>
              </div>
            </div>

            {/* 2. Safe Electrical Fault Trigger */}
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  Simulate Safe Electrical Fault
                </label>
                <select
                  value={selectedLightId}
                  onChange={(e) => setSelectedLightId(e.target.value)}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono"
                >
                  {streetlights.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} (Relay CH {l.relayChannel || 'V'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => simulateFaultCondition(selectedLightId, 'OPEN_CIRCUIT')}
                  className="flex-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2 py-1 rounded text-center font-medium transition-colors"
                  title="Simulates wire cut / open circuit"
                >
                  Open Circuit
                </button>
                <button
                  onClick={() => simulateFaultCondition(selectedLightId, 'OVERCURRENT')}
                  className="flex-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-2 py-1 rounded text-center font-medium transition-colors"
                  title="Simulates safe short-circuit trip signal"
                >
                  Overcurrent
                </button>
                <button
                  onClick={() => simulateFaultCondition(selectedLightId, 'RESTORE')}
                  className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-center font-medium transition-colors"
                  title="Restores normal current & healthy condition"
                >
                  Normalize
                </button>
              </div>
            </div>

            {/* 3. Controller Offline & Reset */}
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => simulateControllerOffline(!isControllerOffline)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded font-medium border transition-colors ${isControllerOffline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
              >
                <WifiOff className="h-3.5 w-3.5" />
                {isControllerOffline ? 'Reconnect ESP32' : 'Disconnect ESP32'}
              </button>

              <button
                onClick={resetAllData}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 font-medium transition-colors"
                title="Reset simulation to initial state"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

