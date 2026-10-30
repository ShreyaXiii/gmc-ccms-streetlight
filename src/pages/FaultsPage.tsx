import React, { useState } from 'react';
import { useCCMS } from '../context/CCMSContext';
import { useAuth } from '../context/AuthContext';
import { FaultRecord, FaultCategory, FaultSeverity, AcknowledgmentStatus } from '../types/fault';
import { SeverityBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { exportToCSV } from '../services/csvExporter';
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  Wrench,
  Search,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface FaultsPageProps {
  onNavigateToMaintenance: () => void;
}

export const FaultsPage: React.FC<FaultsPageProps> = ({ onNavigateToMaintenance }) => {
  const { faults, acknowledgeFault, resolveFault, createMaintenanceTicket, streetlights } = useCCMS();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Ticket creation modal state
  const [ticketModalFault, setTicketModalFault] = useState<FaultRecord | null>(null);
  const [ticketTechnician, setTicketTechnician] = useState('Ramesh Patel (Zone 1 Field Tech)');
  const [ticketPriority, setTicketPriority] = useState<'Medium' | 'High' | 'Critical'>('High');
  const [ticketNotes, setTicketNotes] = useState('');

  const filteredFaults = faults.filter((fault) => {
    const matchesSearch =
      fault.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fault.lightId && fault.lightId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (fault.lightName && fault.lightName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      fault.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || fault.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || fault.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || fault.category === categoryFilter;

    return matchesSearch && matchesSeverity && matchesStatus && matchesCategory;
  });

  const handleOpenTicketModal = (fault: FaultRecord) => {
    setTicketModalFault(fault);
    setTicketPriority(fault.severity === 'CRITICAL' ? 'Critical' : 'Medium');
    setTicketNotes(`Automated maintenance dispatch for ${fault.category}: ${fault.description}`);
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketModalFault) return;

    const matchedLight = streetlights.find((l) => l.id === ticketModalFault.lightId);

    createMaintenanceTicket({
      faultId: ticketModalFault.id,
      lightId: ticketModalFault.lightId || 'SYSTEM',
      lightName: ticketModalFault.lightName || 'Cabinet / Controller',
      ward: matchedLight ? matchedLight.ward : 1,
      title: `Fault Remediation: ${ticketModalFault.category} on ${ticketModalFault.lightId || 'System'}`,
      description: ticketNotes || ticketModalFault.description,
      status: 'Assigned',
      priority: ticketPriority,
      assignedTechnician: ticketTechnician,
      inspectionNotes: [`Created by ${user?.fullName || 'Operator'} from Alert ${ticketModalFault.id}`],
    });

    // Automatically mark the fault as acknowledged
    acknowledgeFault(ticketModalFault.id);
    setTicketModalFault(null);
    onNavigateToMaintenance();
  };

  const handleExportCSV = () => {
    exportToCSV('GMC_Fault_Incident_Log', filteredFaults, [
      { header: 'Fault ID', key: 'id' },
      { header: 'Streetlight ID', key: (f) => f.lightId || 'Cabinet' },
      { header: 'Pole Name', key: (f) => f.lightName || 'Main Gateway' },
      { header: 'Category', key: 'category' },
      { header: 'Severity', key: 'severity' },
      { header: 'Measured Value', key: (f) => `${f.measuredValue} ${f.unit}` },
      { header: 'Threshold Limit', key: (f) => `${f.configuredThreshold} ${f.unit}` },
      { header: 'Status', key: 'status' },
      { header: 'Description', key: 'description' },
      { header: 'Recommended Action', key: 'recommendedAction' },
      { header: 'Timestamp', key: 'timestamp' },
      { header: 'Acknowledged By', key: (f) => f.acknowledgedBy || 'Pending' },
      { header: 'Resolved By', key: (f) => f.resolvedBy || 'Pending' },
    ]);
  };

  const criticalCount = faults.filter((f) => f.severity === 'CRITICAL' && f.status === 'UNACKNOWLEDGED').length;
  const warningCount = faults.filter((f) => f.severity === 'WARNING' && f.status === 'UNACKNOWLEDGED').length;

  return (
    <div className="space-y-6">
      {/* Overview Alarm Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Critical Open Faults</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{criticalCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Open-circuit / Simulated Short-circuit</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Operational Warnings</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{warningCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Daytime Light ON / Voltage Fluctuations</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Resolved Incidents</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {faults.filter((f) => f.status === 'RESOLVED').length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Audited & closed municipal tickets</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faults by light ID, description..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warnings</option>
            <option value="INFO">Informational</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNACKNOWLEDGED">Unacknowledged</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300"
          >
            <option value="ALL">All Categories</option>
            <option value="OPEN_CIRCUIT">Open Circuit</option>
            <option value="SHORT_CIRCUIT_OR_OVERCURRENT">Overcurrent / Short Circuit</option>
            <option value="DAYTIME_LIGHT_ON">Daytime Light ON</option>
            <option value="UNDERVOLTAGE">Under-voltage</option>
            <option value="OVERVOLTAGE">Over-voltage</option>
            <option value="CONTROLLER_OFFLINE">ESP32 Offline</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
          >
            <Download className="h-4 w-4" />
            Export Log
          </button>
        </div>
      </div>

      {/* Faults Cards Feed */}
      <div className="space-y-3">
        {filteredFaults.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-10 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No Fault Incidents Match Query</p>
            <p className="text-xs text-slate-400 mt-1">All streetlight circuits and sensors are within normal tolerances.</p>
          </div>
        ) : (
          filteredFaults.map((fault) => {
            const isUnack = fault.status === 'UNACKNOWLEDGED';
            const isResolved = fault.status === 'RESOLVED';

            return (
              <div
                key={fault.id}
                className={`rounded-xl border p-5 transition-all ${
                  fault.severity === 'CRITICAL'
                    ? isResolved
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                    : 'bg-[#0F172A] border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <SeverityBadge severity={fault.severity} />
                      <span className="font-mono text-xs font-bold text-white tracking-wider">
                        {fault.category}
                      </span>
                      {fault.isSimulated && (
                        <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded">
                          SIMULATED
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-200 mt-2">{fault.description}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      <strong className="text-slate-300">Recommended Action:</strong> {fault.recommendedAction}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Pill */}
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                        fault.status === 'UNACKNOWLEDGED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : fault.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {fault.status}
                    </span>
                  </div>
                </div>

                {/* Technical Measurement Strip */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500">Node: </span>
                    <span className="text-white font-semibold">{fault.lightId || 'Controller Gateway'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Measured: </span>
                    <span className="text-cyan-400 font-semibold">{fault.measuredValue} {fault.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Threshold: </span>
                    <span className="text-slate-300">{fault.configuredThreshold} {fault.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Logged: </span>
                    <span className="text-slate-300">{new Date(fault.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Operator Actions Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[11px] text-slate-400">
                    {fault.acknowledgedBy && (
                      <span>Ack by <strong className="text-slate-300">{fault.acknowledgedBy}</strong></span>
                    )}
                    {fault.resolvedBy && (
                      <span className="ml-3">Resolved by <strong className="text-emerald-400">{fault.resolvedBy}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isUnack && (
                      <button
                        onClick={() => acknowledgeFault(fault.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-semibold transition-colors"
                      >
                        Acknowledge Alert
                      </button>
                    )}

                    {!isResolved && (
                      <button
                        onClick={() => resolveFault(fault.id, 'Inspection completed; normal profile verified.')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 font-semibold transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenTicketModal(fault)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold transition-colors"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      Create Work Order
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MAINTENANCE TICKET MODAL */}
      <Modal
        isOpen={ticketModalFault !== null}
        onClose={() => setTicketModalFault(null)}
        title="Dispatch Maintenance Work Order"
        subtitle={`Generate formal municipal repair ticket from fault incident ${ticketModalFault?.id}`}
      >
        <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Streetlight / Fixture</label>
            <input
              type="text"
              disabled
              value={`${ticketModalFault?.lightId || 'SYSTEM'} — ${ticketModalFault?.lightName || 'Cabinet'}`}
              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ticket Priority</label>
              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value as any)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Field Electrician</label>
              <select
                value={ticketTechnician}
                onChange={(e) => setTicketTechnician(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
              >
                <option value="Ramesh Patel (Zone 1 Field Tech)">Ramesh Patel (Zone 1 Field Tech)</option>
                <option value="Suresh Joshi (High Mast Specialist)">Suresh Joshi (High Mast Specialist)</option>
                <option value="Amit Shah (Feeder & Relay Tech)">Amit Shah (Feeder & Relay Tech)</option>
                <option value="Dinesh Chavda (Emergency Response)">Dinesh Chavda (Emergency Response)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Inspection & Repair Notes</label>
            <textarea
              rows={3}
              value={ticketNotes}
              onChange={(e) => setTicketNotes(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTicketModalFault(null)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950"
            >
              Confirm Dispatch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

