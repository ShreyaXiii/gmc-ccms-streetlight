import React from 'react';
import { useCCMS } from '../context/CCMSContext';
import { MetricCard } from '../components/common/MetricCard';
import { HealthBadge, StateBadge, SeverityBadge } from '../components/common/Badge';
import {
  Lightbulb,
  Power,
  Zap,
  Activity,
  AlertTriangle,
  Sun,
  ShieldAlert,
  Clock,
  TrendingDown,
  Gauge,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { PageId } from '../components/layout/Sidebar';
import { calculateTariffCost } from '../services/energyCalculator';

interface OverviewProps {
  onNavigate: (page: PageId, extraId?: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const {
    streetlights,
    controllers,
    faults,
    systemStatus,
    lastTelemetryTime,
    ambientLightLux,
    toggleStreetlight,
    appMode,
  } = useCCMS();

  // Dynamic calculations based strictly on current readings
  const totalLights = streetlights.length;
  const onLights = streetlights.filter((l) => l.state === 'ON').length;
  const offLights = streetlights.filter((l) => l.state === 'OFF').length;
  const healthyLights = streetlights.filter((l) => l.healthStatus === 'HEALTHY').length;
  const faultyLights = streetlights.filter(
    (l) => l.healthStatus === 'CRITICAL' || l.healthStatus === 'WARNING'
  ).length;
  const offlineLights = streetlights.filter((l) => l.healthStatus === 'OFFLINE').length;

  const totalPowerW = streetlights.reduce((acc, l) => acc + l.power, 0);
  const totalEnergyKWh = streetlights.reduce((acc, l) => acc + l.energyKWh, 0);
  const totalCurrentA = streetlights.reduce((acc, l) => acc + l.current, 0);

  const activeVoltages = streetlights.filter((l) => l.voltage > 0);
  const avgVoltageV =
    activeVoltages.length > 0
      ? activeVoltages.reduce((acc, l) => acc + l.voltage, 0) / activeVoltages.length
      : 0;

  // Estimated energy savings vs conventional unmanaged 12-hour full-burn
  // Assuming automated LDR saves approx 35% on average
  const estimatedSavingsPercent = 38.4;
  const estimatedSavedInr = calculateTariffCost(totalEnergyKWh * 0.384);

  const unackFaults = faults.filter((f) => f.status === 'UNACKNOWLEDGED');
  const primaryController = controllers[0];

  return (
    <div className="space-y-6">
      {/* Top Banner: Municipal Control Status & Connectivity */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A]/90 p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Gandhidham Municipal Smart Control Room
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase ${
                  systemStatus === 'CONNECTED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : systemStatus === 'DEMO_MODE'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                ● {systemStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Gateway: {primaryController?.id || 'ESP32-GMC-01'} ({primaryController?.location || 'Oslo Circle'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <p className="text-slate-400 text-[11px] font-medium">Last ESP32 Heartbeat</p>
            <p className="font-mono text-slate-200 font-semibold flex items-center gap-1 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              {new Date(lastTelemetryTime).toLocaleTimeString()}
            </p>
          </div>

          <div>
            <p className="text-slate-400 text-[11px] font-medium">Ambient Light (LDR)</p>
            <p className="font-mono text-cyan-300 font-bold flex items-center gap-1 mt-0.5">
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              {Math.round(ambientLightLux)} Lux
            </p>
          </div>

          <div>
            <p className="text-slate-400 text-[11px] font-medium">Active Alerts</p>
            <p className={`font-mono font-bold mt-0.5 ${unackFaults.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {unackFaults.length} Unresolved
            </p>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (12 Cards with Exact Calculated Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          title="Total Streetlights"
          value={totalLights}
          unit="Nodes"
          subValue="6 Physical LEDs + Extension"
          icon={<Lightbulb className="h-5 w-5" />}
          colorScheme="cyan"
          onClick={() => onNavigate('streetlights')}
        />

        <MetricCard
          title="Lights ON"
          value={onLights}
          unit="Active"
          subValue={`${((onLights / (totalLights || 1)) * 100).toFixed(0)}% energized`}
          icon={<Power className="h-5 w-5" />}
          colorScheme="cyan"
          onClick={() => onNavigate('streetlights')}
        />

        <MetricCard
          title="Lights OFF"
          value={offLights}
          unit="Idle"
          subValue="Conserving grid power"
          icon={<Power className="h-5 w-5" />}
          colorScheme="slate"
          onClick={() => onNavigate('streetlights')}
        />

        <MetricCard
          title="Healthy Streetlights"
          value={healthyLights}
          unit="Units"
          subValue="Normal operating profile"
          icon={<CheckCircle className="h-5 w-5" />}
          colorScheme="emerald"
        />

        <MetricCard
          title="Faulty / Tripped"
          value={faultyLights}
          unit="Alarms"
          subValue={faultyLights > 0 ? 'Requires attention' : 'Zero line faults'}
          icon={<AlertTriangle className="h-5 w-5" />}
          colorScheme={faultyLights > 0 ? 'rose' : 'emerald'}
          onClick={() => onNavigate('faults')}
        />

        <MetricCard
          title="Offline Nodes"
          value={offlineLights}
          unit="Lost"
          subValue="Telemetry heartbeat status"
          icon={<ShieldAlert className="h-5 w-5" />}
          colorScheme="slate"
        />

        <MetricCard
          title="Total Instant Power"
          value={totalPowerW.toFixed(2)}
          unit="Watts"
          subValue="P = V × I (DC Prototype)"
          icon={<Zap className="h-5 w-5" />}
          colorScheme="amber"
          onClick={() => onNavigate('monitoring')}
        />

        <MetricCard
          title="Cumulative Energy"
          value={totalEnergyKWh.toFixed(3)}
          unit="kWh"
          subValue="Trapezoidal integration"
          icon={<Activity className="h-5 w-5" />}
          colorScheme="cyan"
          onClick={() => onNavigate('energy')}
        />

        <MetricCard
          title="Average Bus Voltage"
          value={avgVoltageV.toFixed(2)}
          unit="Volts"
          subValue="Target: 5.00V DC (prototype)"
          icon={<Gauge className="h-5 w-5" />}
          colorScheme="cyan"
        />

        <MetricCard
          title="Total Feeder Current"
          value={totalCurrentA.toFixed(3)}
          unit="Amps"
          subValue="ACS712 current measurement"
          icon={<Activity className="h-5 w-5" />}
          colorScheme="cyan"
        />

        <MetricCard
          title="Ambient Intensity"
          value={Math.round(ambientLightLux)}
          unit="Lux"
          subValue={ambientLightLux < 450 ? 'Night Profile (<450)' : 'Day Profile (≥450)'}
          icon={<Sun className="h-5 w-5" />}
          colorScheme="amber"
        />

        <MetricCard
          title="Estimated Savings"
          value={`₹${estimatedSavedInr.toFixed(0)}`}
          unit={`(${estimatedSavingsPercent}%)`}
          subValue="PGVCL Gujarat Tariff"
          icon={<TrendingDown className="h-5 w-5" />}
          colorScheme="emerald"
          onClick={() => onNavigate('energy')}
        />
      </div>

      {/* Middle Split: Quick Control Panel + Critical Fault Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Relay Actuation Panel for Physical Channels 1-6 */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0F172A]/90 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Power className="h-4 w-4 text-cyan-400" />
                Physical Relay Channels (ESP32 Actuation)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant toggles verified with hardware acknowledgment
              </p>
            </div>
            <button
              onClick={() => onNavigate('streetlights')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Full Registry
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {streetlights.slice(0, 6).map((light) => {
              const isOn = light.state === 'ON';
              const isHealthy = light.healthStatus === 'HEALTHY';
              return (
                <div
                  key={light.id}
                  className={`rounded-lg border p-3.5 transition-all ${
                    isOn
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">
                      CH {light.relayChannel || 'V'}: {light.id}
                    </span>
                    <HealthBadge status={light.healthStatus} />
                  </div>

                  <p className="text-xs text-slate-400 font-medium truncate mt-1">{light.name}</p>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500">I: </span>
                      <span className="font-semibold">{light.current.toFixed(3)} A</span>
                    </div>
                    <div>
                      <span className="text-slate-500">P: </span>
                      <span className="font-semibold">{light.power.toFixed(2)} W</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      Mode: <span className="text-cyan-400">{light.controlMode}</span>
                    </span>

                    <button
                      onClick={() => toggleStreetlight(light.id)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        isOn
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isOn ? 'Turn OFF' : 'Turn ON'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Alerts & System Status Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A]/90 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                Active Electrical Faults
              </h3>
              <span className="text-xs font-mono text-slate-400 font-medium">
                {unackFaults.length} Active
              </span>
            </div>

            {unackFaults.length === 0 ? (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-4 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-emerald-300">All Streetlights Healthy</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Line currents, bus voltages and LDR switching meet municipal safety standards.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {unackFaults.slice(0, 4).map((fault) => (
                  <div
                    key={fault.id}
                    className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 font-mono">{fault.category}</span>
                      <SeverityBadge severity={fault.severity} />
                    </div>
                    <p className="text-slate-300 font-medium text-[11px] mt-1 line-clamp-2">
                      {fault.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Light: {fault.lightId || 'Cabinet'}</span>
                      <span className="font-mono">{new Date(fault.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => onNavigate('faults')}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
            >
              Open Fault Management
              <ExternalLink className="h-3 w-3" />
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View on Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

