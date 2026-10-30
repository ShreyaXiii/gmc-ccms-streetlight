import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  colorScheme?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subValue,
  icon,
  trend,
  colorScheme = 'cyan',
  onClick,
}) => {
  const colorStyles = {
    cyan: 'border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 bg-cyan-950/20',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
    amber: 'border-amber-500/20 hover:border-amber-500/40 text-amber-400 bg-amber-950/20',
    rose: 'border-rose-500/20 hover:border-rose-500/40 text-rose-400 bg-rose-950/20',
    slate: 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-900/40',
  };

  const iconBgStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    slate: 'bg-slate-800 text-slate-400 border border-slate-700',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-[#0F172A]/90 p-5 shadow-lg backdrop-blur transition-all duration-200 ${
        colorStyles[colorScheme]
      } ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgStyles[colorScheme]}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      {subValue && (
        <p className="mt-1 text-xs text-slate-400 font-medium">{subValue}</p>
      )}

      {trend && (
        <div className="mt-2.5 flex items-center text-xs">
          <span
            className={`font-semibold mr-1.5 ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.isPositive ? '↑ +' : '↓ -'}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
};

