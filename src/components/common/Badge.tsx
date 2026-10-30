import React from 'react';
import { HealthStatus, LightState, HardwareStatus } from '../../types/streetlight';
import { FaultSeverity, AcknowledgmentStatus } from '../../types/fault';

export const HealthBadge: React.FC<{ status: HealthStatus }> = ({ status }) => {
  switch (status) {
    case 'HEALTHY':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Healthy
        </span>
      );
    case 'WARNING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Warning
        </span>
      );
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
          Faulty
        </span>
      );
    case 'OFFLINE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          Offline
        </span>
      );
    default:
      return null;
  }
};

export const StateBadge: React.FC<{ state: LightState }> = ({ state }) => {
  if (state === 'ON') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
        <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        ON
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
      <span className="h-2 w-2 rounded-full bg-slate-500" />
      OFF
    </span>
  );
};

export const HardwareBadge: React.FC<{ status: HardwareStatus; channel?: number | null }> = ({
  status,
  channel,
}) => {
  if (status === 'physical') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-950/60 text-blue-300 border border-blue-800/50">
        Relay CH {channel} (Physical)
      </span>
    );
  }
  if (status === 'virtual') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-950/60 text-purple-300 border border-purple-800/50">
        Virtual Node
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
      Unassigned
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: FaultSeverity }> = ({ severity }) => {
  if (severity === 'CRITICAL') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
        CRITICAL
      </span>
    );
  }
  if (severity === 'WARNING') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
        WARNING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
      INFO
    </span>
  );
};

