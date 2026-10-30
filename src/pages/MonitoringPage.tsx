import React, { useState, useMemo } from 'react';
import { useCCMS } from '../context/CCMSContext';
import { generateHistoricalReadings } from '../services/demoSimulator';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { Activity, Zap, Gauge, Sun, AlertTriangle, Clock, Layers, Filter } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const { streetlights, ambientLightLux, faults } = useCCMS();
  const [selectedHours, setSelectedHours] = useState<number>(4);
  const [selectedLightIds, setSelectedLightIds] = useState<string[]>(['SL-GMC-001', 'SL-GMC-002']);

  // Dynamic readings generated based strictly on time range selected
  const timeSeriesData = useMemo(() => {
    // Collect samples for selected lights
    const samplesCount = selectedHours <= 4 ? 24 : selectedHours <= 24 ? 36 : 48;
    const baseReadings = generateHistoricalReadings('AGGREGATE', selectedHours, samplesCount);

    return baseReadings.map((r, idx) => {
      // Calculate aggregate and individual values
      const activeCount = r.state === 'ON' ? streetlights.length - 1 : 0;
      const totalPowerW = Number((r.power * (activeCount || 1)).toFixed(2));
      const totalCurrentA = Number((r.current * (activeCount || 1)).toFixed(3));
      const savingsW = r.state === 'OFF' ? 4.2 : 0.8; // Watts saved when idle or dimmed

      return {
        timestamp: r.timestamp,
        timeFormatted: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateFormatted: new Date(r.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        totalPowerW,
        totalCurrentA,
        voltageV: r.voltage,
        energyKWh: Number((r.energyKWh * 5).toFixed(4)),
        ambientLightLux: r.ambientLight,
        activeCount,
        savingsW,
        light1_Power: Number((r.power * 1.02).toFixed(2)),
        light2_Power: Number((r.power * 0.98).toFixed(2)),
        light3_Power: Number((r.power * 1.05).toFixed(2)),
      };
    });
  }, [selectedHours, streetlights]);

  const toggleSelectLight = (id: string) => {
    if (selectedLightIds.includes(id)) {
      if (selectedLightIds.length > 1) {
        setSelectedLightIds(selectedLightIds.filter((x) => x !== id));
      }
    } else {
      setSelectedLightIds([...selectedLightIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector Strip */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Telemetry Time-Window:
          </span>
          <span className="text-xs text-slate-400">
            (Filter changes queries and graphs in real time)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          {[
            { label: 'Last 1 Hour', hours: 1 },
            { label: 'Last 4 Hours', hours: 4 },
            { label: 'Last 8 Hours', hours: 8 },
            { label: 'Last 12 Hours', hours: 12 },
            { label: 'Last 24 Hours', hours: 24 },
            { label: 'Last 7 Days', hours: 168 },
          ].map((item) => (
            <button
              key={item.hours}
              onClick={() => setSelectedHours(item.hours)}
              className={`px-3 py-1.5 rounded font-mono font-medium transition-all ${selectedHours === item.hours
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Main Total Power Chart + Energy Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Total Power & Grid Load */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                Total System Power Consumption (W)
              </h3>
              <p className="text-xs text-slate-400">Instantaneous load across municipal feeders</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/60">
              Watts vs Time
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalPowerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="timeFormatted" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} unit="W" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="totalPowerW"
                  name="Total Power (W)"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fill="url(#totalPowerGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Cumulative Integrated Energy Consumption */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Cumulative Energy (kWh Integration)
              </h3>
              <p className="text-xs text-slate-400">Trapezoidal numerical integration over timestamped samples</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60">
              kWh Accumulated
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="timeFormatted" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} unit="kWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="energyKWh"
                  name="Cumulative Energy (kWh)"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#energyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Voltage Stability & Ambient Light Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Voltage Stability & Feeder Current */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gauge className="h-4 w-4 text-amber-400" />
                Feeder Voltage (V) & Line Current (A)
              </h3>
              <p className="text-xs text-slate-400">Harmonics & voltage sag detection</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-800/60">
              V & A
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="timeFormatted" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="voltageV"
                  name="Bus Voltage (V)"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="totalCurrentA"
                  name="Feeder Current (A)"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Ambient Light (LDR) vs Energized Streetlight Nodes */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-400" />
                Ambient Light (Lux) vs Active Streetlights
              </h3>
              <p className="text-xs text-slate-400">Verifies automated dusk-to-dawn switching threshold</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-800/60">
              LDR Lux vs Nodes
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="timeFormatted" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="ambientLightLux"
                  name="Ambient Light (Lux)"
                  stroke="#EAB308"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="stepAfter"
                  dataKey="activeCount"
                  name="Active Lamps ON"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-Streetlight Comparative Analysis */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Multi-Streetlight Comparative Load Profile
            </h3>
            <p className="text-xs text-slate-400">Select multiple streetlights to compare electrical curves side-by-side</p>
          </div>

          {/* Light selector pills */}
          <div className="flex flex-wrap items-center gap-2">
            {streetlights.slice(0, 6).map((l) => {
              const isSelected = selectedLightIds.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => toggleSelectLight(l.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors border ${isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                >
                  {l.id} (Relay {l.relayChannel || 'V'})
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="timeFormatted" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} unit="W" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {selectedLightIds.includes('SL-GMC-001') && (
                <Line type="monotone" dataKey="light1_Power" name="SL-GMC-001 (Relay 1)" stroke="#06B6D4" strokeWidth={2} dot={false} />
              )}
              {selectedLightIds.includes('SL-GMC-002') && (
                <Line type="monotone" dataKey="light2_Power" name="SL-GMC-002 (Relay 2)" stroke="#10B981" strokeWidth={2} dot={false} />
              )}
              {selectedLightIds.includes('SL-GMC-003') && (
                <Line type="monotone" dataKey="light3_Power" name="SL-GMC-003 (Relay 3)" stroke="#F59E0B" strokeWidth={2} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
