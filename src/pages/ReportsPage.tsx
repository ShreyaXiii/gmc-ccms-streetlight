import React, { useState } from 'react';
import { useCCMS } from '../context/CCMSContext';
import { exportToCSV } from '../services/csvExporter';
import { calculateTariffCost } from '../services/energyCalculator';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  Zap,
  Cpu,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { streetlights, faults, tickets, controllers } = useCCMS();
  const [selectedReportType, setSelectedReportType] = useState<
    'health' | 'energy' | 'faults' | 'maintenance' | 'controllers'
  >('health');

  const handleExport = () => {
    const timestamp = new Date().toISOString();

    if (selectedReportType === 'health') {
      exportToCSV('GMC_Streetlight_Health_Audit', streetlights, [
        { header: 'ID', key: 'id' },
        { header: 'Name', key: 'name' },
        { header: 'Ward', key: 'ward' },
        { header: 'State', key: 'state' },
        { header: 'Health Status', key: 'healthStatus' },
        { header: 'Relay Channel', key: (l) => l.relayChannel || 'Virtual' },
        { header: 'Current (A)', key: 'current' },
        { header: 'Voltage (V)', key: 'voltage' },
        { header: 'Power (W)', key: 'power' },
        { header: 'Energy (kWh)', key: 'energyKWh' },
        { header: 'Last Communication', key: 'lastCommunication' },
      ]);
    } else if (selectedReportType === 'energy') {
      exportToCSV(
        'GMC_Energy_Consumption_Report',
        streetlights.map((l) => ({
          ...l,
          costInr: calculateTariffCost(l.energyKWh),
        })),
        [
          { header: 'ID', key: 'id' },
          { header: 'Name', key: 'name' },
          { header: 'Ward', key: 'ward' },
          { header: 'Energy (kWh)', key: 'energyKWh' },
          { header: 'Cost (INR @ ₹7.20/kWh)', key: 'costInr' },
        ]
      );
    } else if (selectedReportType === 'faults') {
      exportToCSV('GMC_Fault_Incident_Audit', faults, [
        { header: 'Fault ID', key: 'id' },
        { header: 'Light ID', key: (f) => f.lightId || 'Cabinet' },
        { header: 'Category', key: 'category' },
        { header: 'Severity', key: 'severity' },
        { header: 'Description', key: 'description' },
        { header: 'Measured Value', key: (f) => `${f.measuredValue} ${f.unit}` },
        { header: 'Threshold', key: (f) => `${f.configuredThreshold} ${f.unit}` },
        { header: 'Status', key: 'status' },
        { header: 'Timestamp', key: 'timestamp' },
      ]);
    } else if (selectedReportType === 'maintenance') {
      exportToCSV('GMC_Maintenance_Tickets_Audit', tickets, [
        { header: 'Ticket ID', key: 'id' },
        { header: 'Light ID', key: 'lightId' },
        { header: 'Title', key: 'title' },
        { header: 'Priority', key: 'priority' },
        { header: 'Status', key: 'status' },
        { header: 'Technician', key: (t) => t.assignedTechnician || 'Unassigned' },
        { header: 'Created At', key: 'createdAt' },
        { header: 'Resolved At', key: (t) => t.resolvedAt || 'Pending' },
      ]);
    } else if (selectedReportType === 'controllers') {
      exportToCSV('GMC_Controller_Gateway_Audit', controllers, [
        { header: 'Controller ID', key: 'id' },
        { header: 'Name', key: 'name' },
        { header: 'Location', key: 'location' },
        { header: 'IP Address', key: 'ipAddress' },
        { header: 'Status', key: 'status' },
        { header: 'Firmware', key: 'firmwareVersion' },
        { header: 'Uptime (Seconds)', key: 'uptimeSeconds' },
        { header: 'Last Heartbeat', key: 'lastHeartbeat' },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
            Municipal Audit Reports & Data Export Portal
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compliant with Government of Gujarat urban infrastructure reporting standards
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-glow-cyan transition-all"
        >
          <Download className="h-4 w-4" />
          Download Selected Report (CSV)
        </button>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { id: 'health', title: 'Streetlight Health', icon: CheckCircle, desc: 'Operational status, current, voltage' },
          { id: 'energy', title: 'Energy & Billing', icon: Zap, desc: 'kWh breakdown & tariff cost' },
          { id: 'faults', title: 'Fault Incidents', icon: AlertTriangle, desc: 'Open-circuit, overcurrent logs' },
          { id: 'maintenance', title: 'Work Orders', icon: FileSpreadsheet, desc: 'Technician repair audit trail' },
          { id: 'controllers', title: 'IoT Gateways', icon: Cpu, desc: 'ESP32 uptime & availability' },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = selectedReportType === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedReportType(item.id as any)}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md ring-1 ring-cyan-500'
                  : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
              }`}
            >
              <Icon
                className={`h-5 w-5 mb-2 ${
                  isSelected ? 'text-cyan-400' : 'text-slate-400'
                }`}
              />
              <h4 className="text-xs font-bold text-white">{item.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Live Preview Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white capitalize">
              Live Preview: {selectedReportType} Report
            </h3>
            <p className="text-xs text-slate-400">
              Showing active municipal dataset ready for official audit export
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-1 rounded border border-cyan-800">
            ISO-8601 Timestamped
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B1120] text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2.5">Record ID</th>
                <th className="px-3 py-2.5">Entity / Name</th>
                <th className="px-3 py-2.5">Key Metric</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Logged Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 text-xs">
              {selectedReportType === 'health' &&
                streetlights.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-cyan-400 font-bold">{l.id}</td>
                    <td className="px-3 py-2 text-white font-sans">{l.name}</td>
                    <td className="px-3 py-2 text-amber-300">
                      {l.power.toFixed(2)} W ({l.current.toFixed(3)} A)
                    </td>
                    <td className="px-3 py-2 text-emerald-400">{l.healthStatus}</td>
                    <td className="px-3 py-2 text-slate-400 text-[11px]">{l.lastCommunication}</td>
                  </tr>
                ))}

              {selectedReportType === 'energy' &&
                streetlights.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-cyan-400 font-bold">{l.id}</td>
                    <td className="px-3 py-2 text-white font-sans">{l.name}</td>
                    <td className="px-3 py-2 text-emerald-400">{l.energyKWh.toFixed(4)} kWh</td>
                    <td className="px-3 py-2 text-amber-300">
                      ₹{calculateTariffCost(l.energyKWh).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-slate-400 text-[11px]">{l.updatedAt}</td>
                  </tr>
                ))}

              {selectedReportType === 'faults' &&
                faults.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-rose-400 font-bold">{f.id}</td>
                    <td className="px-3 py-2 text-white font-sans">{f.category}</td>
                    <td className="px-3 py-2 text-slate-300">
                      {f.measuredValue} {f.unit}
                    </td>
                    <td className="px-3 py-2 text-amber-400">{f.status}</td>
                    <td className="px-3 py-2 text-slate-400 text-[11px]">{f.timestamp}</td>
                  </tr>
                ))}

              {selectedReportType === 'maintenance' &&
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-cyan-400 font-bold">{t.id}</td>
                    <td className="px-3 py-2 text-white font-sans">{t.title}</td>
                    <td className="px-3 py-2 text-slate-300 font-sans">{t.assignedTechnician}</td>
                    <td className="px-3 py-2 text-emerald-400">{t.status}</td>
                    <td className="px-3 py-2 text-slate-400 text-[11px]">{t.createdAt}</td>
                  </tr>
                ))}

              {selectedReportType === 'controllers' &&
                controllers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-cyan-400 font-bold">{c.id}</td>
                    <td className="px-3 py-2 text-white font-sans">{c.name}</td>
                    <td className="px-3 py-2 text-slate-300">IP: {c.ipAddress}</td>
                    <td className="px-3 py-2 text-emerald-400">{c.status}</td>
                    <td className="px-3 py-2 text-slate-400 text-[11px]">{c.lastHeartbeat}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

