import React, { useState, useMemo } from 'react';
import { useCCMS } from '../context/CCMSContext';
import { HealthBadge, StateBadge, HardwareBadge, SeverityBadge } from '../components/common/Badge';
import { generateHistoricalReadings } from '../services/demoSimulator';
import {
  ArrowLeft,
  Power,
  Zap,
  Activity,
  Gauge,
  Sun,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

interface StreetlightDetailsProps {
  lightId: string;
  onBack: () => void;
  onNavigateToMap: (lightId: string) => void;
}

export const StreetlightDetails: React.FC<StreetlightDetailsProps> = ({
  lightId,
  onBack,
  onNavigateToMap,
}) => {
  const { streetlights, toggleStreetlight, setStreetlightMode, faults, ambientLightLux } = useCCMS();
  const [timeRangeHours, setTimeRangeHours] = useState<number>(4);
  const [commandFeedback, setCommandFeedback] = useState<{
    status: 'IDLE' | 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'FAILED';
    message: string;
  }>({ status: 'IDLE', message: '' });

  const light = streetlights.find((l) => l.id === lightId);

  // Filter faults related to this light
  const lightFaults = useMemo(() => {
    return faults.filter((f) => f.lightId === lightId);
  }, [faults, lightId]);

  // Generate historical readings based on selected time-range
  const historicalData = useMemo(() => {
    if (!light) return [];
    return generateHistoricalReadings(light.id, timeRangeHours, 24);
  }, [light, timeRangeHours]);

  if (!light) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-8 text-center space-y-4">
        <p className="text-slate-400">Streetlight node not found or removed.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const handleToggle = async () => {
    setCommandFeedback({ status: 'PENDING', message: 'Dispatching command to ESP32 Gateway...' });
    const nextState = light.state === 'ON' ? 'OFF' : 'ON';

    const success = await toggleStreetlight(light.id, nextState);
    if (success) {
      setCommandFeedback({
        status: 'COMPLETED',
        message: `Command ACK: Light successfully set to ${nextState} (Relay actuated).`,
      });
    } else {
      setCommandFeedback({
        status: 'FAILED',
        message: 'Command timeout: Controller did not acknowledge relay state change.',
      });
    }

    setTimeout(() => {
      setCommandFeedback({ status: 'IDLE', message: '' });
    }, 4000);
  };

  const handleModeChange = (mode: 'auto' | 'manual' | 'scheduled') => {
    setStreetlightMode(light.id, mode);
    setCommandFeedback({
      status: 'COMPLETED',
      message: `Operating mode updated to ${mode.toUpperCase()}.`,
    });
    setTimeout(() => setCommandFeedback({ status: 'IDLE', message: '' }), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">{light.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-bold">
                {light.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ward {light.ward} • {light.streetName} • Gandhidham
            </p>
          </div>
        </div>

        {/* Quick Actuation Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToMap(light.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <MapPin className="h-4 w-4 text-cyan-400" />
            View on Map
          </button>

          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${light.state === 'ON'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-glow-cyan'
              }`}
          >
            <Power className="h-4 w-4" />
            {light.state === 'ON' ? 'Command Lamp OFF' : 'Command Lamp ON'}
          </button>
        </div>
      </div>

      {/* Command Feedback Notification */}
      {commandFeedback.status !== 'IDLE' && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-xs flex items-center justify-between font-medium ${commandFeedback.status === 'COMPLETED'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : commandFeedback.status === 'FAILED'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <RefreshCw
              className={`h-4 w-4 ${commandFeedback.status === 'PENDING' ? 'animate-spin' : ''
                }`}
            />
            <span>{commandFeedback.message}</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
            Status: {commandFeedback.status}
          </span>
        </div>
      )}

      {/* Live Measurement Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
          <p className="text-[11px] text-slate-400 uppercase font-medium">Relay State</p>
          <div className="mt-2 flex items-center justify-between">
            <StateBadge state={light.state} />
            <HardwareBadge status={light.hardwareStatus} channel={light.relayChannel} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
          <p className="text-[11px] text-slate-400 uppercase font-medium">Measured Voltage</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-white">{light.voltage.toFixed(2)}</span>
            <span className="text-xs text-slate-400">V</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Bus Voltage Sensor</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
          <p className="text-[11px] text-slate-400 uppercase font-medium">Measured Current</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-white">{light.current.toFixed(3)}</span>
            <span className="text-xs text-slate-400">A</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">ACS712 Channel</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
          <p className="text-[11px] text-slate-400 uppercase font-medium">Instant Power</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-cyan-400">{light.power.toFixed(2)}</span>
            <span className="text-xs text-slate-400">Watts</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">P = V × I (DC)</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
          <p className="text-[11px] text-slate-400 uppercase font-medium">Total Energy</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {light.energyKWh.toFixed(3)}
            </span>
            <span className="text-xs text-slate-400">kWh</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Integrated Run</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
          <p className="text-[11px] text-slate-400 uppercase font-medium">Health Profile</p>
          <div className="mt-2 flex items-center justify-between">
            <HealthBadge status={light.healthStatus} />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {light.lastFault || 'Normal operations'}
          </p>
        </div>
      </div>

      {/* Mode Controls and Metadata Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Mode Selection & Controller Binding */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            Controller & Hardware Assignment
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Assigned Controller</span>
              <span className="font-mono text-white font-semibold">{light.controllerId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Physical Relay Channel</span>
              <span className="font-mono text-cyan-400 font-bold">
                {light.relayChannel ? `Channel ${light.relayChannel}` : 'Virtual / Unassigned'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">GIS Coordinates</span>
              <span className="font-mono text-slate-300">
                {light.latitude.toFixed(4)}, {light.longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Ambient Light</span>
              <span className="font-mono text-amber-300">{Math.round(ambientLightLux)} Lux</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Last Telemetry</span>
              <span className="font-mono text-slate-300">
                {new Date(light.lastCommunication).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-300 mb-2">Switch Control Mode:</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(['auto', 'manual', 'scheduled'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`py-1.5 text-xs font-semibold rounded uppercase font-mono transition-colors ${light.controlMode === m
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Real-time Multi-metric Historical Charts */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0F172A] p-5">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                Historical Electrical Profile (Power & Current)
              </h3>
              <p className="text-xs text-slate-400">
                Dynamic time-series telemetry filtered strictly by selected interval
              </p>
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              {[1, 4, 8, 12, 24].map((hours) => (
                <button
                  key={hours}
                  onClick={() => setTimeRangeHours(hours)}
                  className={`px-2 py-1 rounded font-mono font-medium transition-colors ${timeRangeHours === hours
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Power Profile */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  stroke="#64748B"
                  fontSize={10}
                />
                <YAxis stroke="#64748B" fontSize={10} unit="W" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
                  labelFormatter={(val) => new Date(val).toLocaleString()}
                />
                <Area
                  type="monotone"
                  dataKey="power"
                  name="Power (W)"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#powerGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Voltage & Current Dual Chart */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
        <h3 className="text-sm font-bold text-white tracking-wide mb-3 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-emerald-400" />
          Voltage (V) & Current (A) Stability Timeline
        </h3>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                stroke="#64748B"
                fontSize={10}
              />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
              />
              <Line
                type="monotone"
                dataKey="voltage"
                name="Voltage (V)"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="current"
                name="Current (A)"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fault History for this light */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
        <h3 className="text-sm font-bold text-white tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          Individual Fault History & Diagnostic Records
        </h3>

        {lightFaults.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No faults recorded for this streetlight node.</p>
        ) : (
          <div className="space-y-2">
            {lightFaults.map((fault) => (
              <div
                key={fault.id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">{fault.category}</span>
                    <SeverityBadge severity={fault.severity} />
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{fault.description}</p>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  <div>Status: <span className="text-amber-400">{fault.status}</span></div>
                  <div>{new Date(fault.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

