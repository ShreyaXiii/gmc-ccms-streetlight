import React, { useState } from 'react';
import { useCCMS } from '../context/CCMSContext';
import { useAuth } from '../context/AuthContext';
import { MaintenanceTicket, TicketStatus, TicketPriority } from '../types/maintenance';
import { Modal } from '../components/common/Modal';
import { exportToCSV } from '../services/csvExporter';
import {
  Wrench,
  Plus,
  CheckCircle2,
  Clock,
  UserCheck,
  Download,
  Search,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const { tickets, createMaintenanceTicket, updateMaintenanceTicket, streetlights } = useCCMS();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<MaintenanceTicket | null>(null);
  const [inspectionNoteText, setInspectionNoteText] = useState('');

  // New Ticket Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLightId, setNewLightId] = useState(streetlights[0]?.id || 'SL-GMC-001');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Medium');
  const [newTechnician, setNewTechnician] = useState('Ramesh Patel (Zone 1 Field Tech)');

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lightId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignedTechnician && t.assignedTechnician.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const light = streetlights.find((l) => l.id === newLightId);

    createMaintenanceTicket({
      lightId: newLightId,
      lightName: light?.name || 'Streetlight Node',
      ward: light?.ward || 1,
      title: newTitle,
      description: newDesc,
      status: 'Assigned',
      priority: newPriority,
      assignedTechnician: newTechnician,
      inspectionNotes: [`Created by ${user?.fullName || 'Operator'} at ${new Date().toLocaleString()}`],
    });

    setIsAddOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleAddInspectionNote = () => {
    if (!activeTicket || !inspectionNoteText.trim()) return;

    const updatedNotes = [
      ...(activeTicket.inspectionNotes || []),
      `[${new Date().toLocaleDateString()}] ${user?.fullName || 'Tech'}: ${inspectionNoteText.trim()}`,
    ];

    updateMaintenanceTicket(activeTicket.id, {
      inspectionNotes: updatedNotes,
    });

    setActiveTicket({ ...activeTicket, inspectionNotes: updatedNotes });
    setInspectionNoteText('');
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    const updates: Partial<MaintenanceTicket> = { status: newStatus };
    if (newStatus === 'Resolved' || newStatus === 'Closed') {
      updates.resolvedAt = new Date().toISOString();
    }
    updateMaintenanceTicket(ticketId, updates);
    if (activeTicket && activeTicket.id === ticketId) {
      setActiveTicket({ ...activeTicket, ...updates });
    }
  };

  const handleExportCSV = () => {
    exportToCSV('GMC_Maintenance_Tickets', filteredTickets, [
      { header: 'Ticket ID', key: 'id' },
      { header: 'Streetlight ID', key: 'lightId' },
      { header: 'Pole Name', key: 'lightName' },
      { header: 'Ward', key: 'ward' },
      { header: 'Title', key: 'title' },
      { header: 'Priority', key: 'priority' },
      { header: 'Status', key: 'status' },
      { header: 'Assigned Technician', key: (t) => t.assignedTechnician || 'Unassigned' },
      { header: 'Created By', key: 'createdBy' },
      { header: 'Created At', key: 'createdAt' },
      { header: 'Resolved At', key: (t) => t.resolvedAt || 'Pending' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
          <p className="text-xs uppercase font-medium text-slate-400">Total Work Orders</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{tickets.length}</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-xs uppercase font-bold text-amber-400">In Progress</p>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {tickets.filter((t) => t.status === 'In Progress' || t.status === 'Assigned').length}
          </p>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
          <p className="text-xs uppercase font-bold text-rose-400">Critical Priority</p>
          <p className="text-2xl font-bold font-mono text-rose-300 mt-1">
            {tickets.filter((t) => t.priority === 'Critical' && t.status !== 'Closed').length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="text-xs uppercase font-bold text-emerald-400">Completed & Closed</p>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length}
          </p>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, light, technician..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300"
          >
            <option value="ALL">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-bold shadow-glow-cyan"
          >
            <Plus className="h-4 w-4" />
            Create Work Order
          </button>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B1120] text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
            <tr>
              <th className="px-4 py-3">Ticket ID</th>
              <th className="px-4 py-3">Fixture / Node</th>
              <th className="px-4 py-3">Task Title & Details</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Assigned Electrician</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No maintenance work orders found matching criteria.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-cyan-400">{t.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white">{t.lightId}</span>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{t.lightName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-200">{t.title}</span>
                    <div className="text-[11px] text-slate-400 truncate max-w-[220px]">{t.description}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        t.priority === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : t.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{t.assignedTechnician || 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value as TicketStatus)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 font-medium"
                    >
                      <option value="Open">Open</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setActiveTicket(t)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TICKET INSPECTION & NOTES MODAL */}
      <Modal
        isOpen={activeTicket !== null}
        onClose={() => setActiveTicket(null)}
        title={`Work Order Detail — ${activeTicket?.id}`}
        subtitle={`Fixture: ${activeTicket?.lightId} (Ward ${activeTicket?.ward})`}
      >
        {activeTicket && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Title:</span>
                <span className="text-white font-semibold">{activeTicket.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Tech:</span>
                <span className="text-cyan-400 font-semibold">{activeTicket.assignedTechnician}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{activeTicket.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="text-slate-300">{new Date(activeTicket.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Inspection Trail */}
            <div>
              <p className="font-semibold text-slate-200 mb-2">Technician Inspection Log:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-800">
                {activeTicket.inspectionNotes?.length ? (
                  activeTicket.inspectionNotes.map((note, idx) => (
                    <div key={idx} className="text-slate-300 text-[11px] pb-1 border-b border-slate-900 last:border-none">
                      {note}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No notes recorded yet.</p>
                )}
              </div>
            </div>

            {/* Append Note */}
            <div>
              <label className="block text-slate-400 mb-1">Add Inspection Log Entry:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inspectionNoteText}
                  onChange={(e) => setInspectionNoteText(e.target.value)}
                  placeholder="e.g. Replaced 10A terminal fuse and verified 5.0V bus line..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddInspectionNote}
                  className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Post Note
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-500 font-mono">Logged by: {activeTicket.createdBy}</span>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE WORK ORDER MODAL */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Maintenance Work Order"
        subtitle="Dispatch field technician for fixture repair or scheduled inspection"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Target Streetlight</label>
            <select
              value={newLightId}
              onChange={(e) => setNewLightId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
            >
              {streetlights.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} — {l.name} (Ward {l.ward})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Work Order Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., LED fixture driver replacement & wiring check"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Assign Electrician</label>
              <select
                value={newTechnician}
                onChange={(e) => setNewTechnician(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
              >
                <option value="Ramesh Patel (Zone 1 Field Tech)">Ramesh Patel (Zone 1 Field Tech)</option>
                <option value="Suresh Joshi (High Mast Specialist)">Suresh Joshi (High Mast Specialist)</option>
                <option value="Amit Shah (Feeder & Relay Tech)">Amit Shah (Feeder & Relay Tech)</option>
                <option value="Dinesh Chavda (Emergency Response)">Dinesh Chavda (Emergency Response)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Work Description & Scope</label>
            <textarea
              rows={3}
              required
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Detail issues, symptoms, and safety precautions..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 font-bold text-slate-950"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

