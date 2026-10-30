import React, { useState, useMemo } from 'react';
import { useCCMS } from '../context/CCMSContext';
import { calculateTariffCost, calculateSavings } from '../services/energyCalculator';
import { exportToCSV } from '../services/csvExporter';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Zap, IndianRupee, TrendingDown, Download, Sliders, Calendar } from 'lucide-react';

const COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

export const EnergyPage: React.FC = () => {
  const { streetlights } = useCCMS();
  const [tariffRate, setTariffRate] = useState<number>(7.2); // ₹ 7.20 / kWh (PGVCL Gujarat)
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Dynamic calculations from active streetlight records
  const totalEnergyKWh = streetlights.reduce((acc, l) => acc + l.energyKWh, 0);
  const totalCostInr = calculateTariffCost(totalEnergyKWh, tariffRate);

  // Baseline without automation (approx 1.55x power consumed)
  const baselineKWh = totalEnergyKWh * 1.55;
  const savings = calculateSavings(totalEnergyKWh, baselineKWh, tariffRate);

  // Consumption by Light
  const lightData = useMemo(() => {
    return streetlights.map((l) => ({
      name: l.id,
      label: l.name,
      kwh: Number(l.energyKWh.toFixed(3)),
      cost: Number(calculateTariffCost(l.energyKWh, tariffRate).toFixed(1)),
      ward: `Ward ${l.ward}`,
    }));
  }, [streetlights, tariffRate]);

  // Consumption by Ward
  const wardData = useMemo(() => {
    const wardsMap: Record<number, number> = {};
    streetlights.forEach((l) => {
      wardsMap[l.ward] = (wardsMap[l.ward] || 0) + l.energyKWh;
    });

    return Object.entries(wardsMap).map(([ward, kwh]) => ({
      name: `Ward ${ward}`,
      kwh: Number(kwh.toFixed(3)),
      cost: Number(calculateTariffCost(kwh, tariffRate).toFixed(1)),
    }));
  }, [streetlights, tariffRate]);

  // Daily Trend Mockup for selected range
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => {
      const multiplier = 0.85 + (idx % 3) * 0.12;
      const actual = Number(((totalEnergyKWh / 7) * multiplier).toFixed(3));
      const baseline = Number((actual * 1.5).toFixed(3));
      return {
        day,
        actualKWh: actual,
        baselineKWh: baseline,
        savedKWh: Number((baseline - actual).toFixed(3)),
      };
    });
  }, [totalEnergyKWh]);

  const handleExportCSV = () => {
    exportToCSV('GMC_Energy_Consumption_Report', lightData, [
      { header: 'Streetlight ID', key: 'name' },
      { header: 'Location Name', key: 'label' },
      { header: 'Municipal Ward', key: 'ward' },
      { header: 'Energy (kWh)', key: 'kwh' },
      { header: `Cost (INR @ ₹${tariffRate}/kWh)`, key: 'cost' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Tariff & Tariff Setting Strip */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Gujarat PGVCL Electricity Tariff & Cost Calculator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Public lighting rate schedule: Tariff LTMD / Commercial Streetlighting
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-300 font-medium">Configured Tariff:</span>
            <span className="font-mono text-cyan-300 font-bold">₹</span>
            <input
              type="number"
              step="0.10"
              value={tariffRate}
              onChange={(e) => setTariffRate(parseFloat(e.target.value) || 0)}
              className="w-16 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 font-mono text-white text-xs"
            />
            <span className="text-slate-400">/ kWh</span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Energy Audit
          </button>
        </div>
      </div>

      {/* Primary Energy KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs uppercase font-medium">
            <span>Total Energy Consumed</span>
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {totalEnergyKWh.toFixed(3)}{' '}
            <span className="text-sm text-slate-400 font-normal">kWh</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Verified numerical integration</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs uppercase font-medium">
            <span>Electricity Bill (PGVCL)</span>
            <IndianRupee className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-2">
            ₹{totalCostInr.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Computed @ ₹{tariffRate.toFixed(2)} / kWh</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5 shadow-lg">
          <div className="flex justify-between items-center text-emerald-400 text-xs uppercase font-bold">
            <span>Estimated Savings</span>
            <TrendingDown className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">
            ₹{savings.savedInr.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">
            {savings.savingsPercent}% lower vs unautomated full-burn
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs uppercase font-medium">
            <span>Saved Electrical Units</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {savings.savedKWh.toFixed(2)}{' '}
            <span className="text-sm text-slate-400 font-normal">kWh</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">LDR automated switching savings</p>
        </div>
      </div>

      {/* Charts Grid: Ward Distribution + Actual vs Baseline Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward-by-Ward Consumption Chart */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Consumption by Municipal Ward</h3>
              <p className="text-xs text-slate-400">Total kWh aggregated by geographic ward</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              kWh per Ward
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit="kWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="kwh" name="Energy (kWh)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actual vs Baseline Savings Trend */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Smart CCMS vs Baseline Consumption</h3>
              <p className="text-xs text-slate-400">Comparative savings curve over weekly cycle</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Savings Curve
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit="kWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="actualKWh" name="Actual CCMS (Smart LDR)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="baselineKWh" name="Unmanaged Baseline" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Individual Streetlight Consumption Breakdown Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
        <h3 className="text-sm font-bold text-white mb-3">Individual Node Energy & Billing Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1120] text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-2.5">Node ID</th>
                <th className="px-4 py-2.5">Pole Location</th>
                <th className="px-4 py-2.5">Ward</th>
                <th className="px-4 py-2.5 font-mono">Energy (kWh)</th>
                <th className="px-4 py-2.5 font-mono">Electricity Cost (INR)</th>
                <th className="px-4 py-2.5 font-mono">Est. Savings (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {streetlights.map((light) => {
                const cost = calculateTariffCost(light.energyKWh, tariffRate);
                const saved = calculateTariffCost(light.energyKWh * 0.55, tariffRate);
                return (
                  <tr key={light.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono font-bold text-cyan-400">{light.id}</td>
                    <td className="px-4 py-2.5">{light.name}</td>
                    <td className="px-4 py-2.5">Ward {light.ward}</td>
                    <td className="px-4 py-2.5 font-mono">{light.energyKWh.toFixed(4)}</td>
                    <td className="px-4 py-2.5 font-mono text-amber-300">₹{cost.toFixed(2)}</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-400">₹{saved.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

