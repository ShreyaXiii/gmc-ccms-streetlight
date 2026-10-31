import React, { useState, useMemo } from 'react';
import { useCCMS } from '../context/CCMSContext';
import { useAuth } from '../context/AuthContext';
import { Streetlight, StreetlightInput, HealthStatus, LightState, HardwareStatus } from '../types/streetlight';
import { HealthBadge, StateBadge, HardwareBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { exportToCSV } from '../services/csvExporter';
import {
  Search,
  Filter,
  Plus,
  Download,
  Power,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { PageId } from '../components/layout/Sidebar';

interface StreetlightsProps {
  onNavigateToDetails: (lightId: string) => void;
}

export const Streetlights: React.FC<StreetlightsProps> = ({ onNavigateToDetails }) => {
  const { streetlights, toggleStreetlight, addStreetlight, updateStreetlight, deleteStreetlight } = useCCMS();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const [hardwareFilter, setHardwareFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLight, setEditingLight] = useState<Streetlight | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<StreetlightInput>({
    name: '',
    ward: 1,
    streetName: '',
    latitude: 23.078,
    longitude: 70.134,
    controllerId: 'ESP32-GMC-01',
    relayChannel: null,
    hardwareStatus: 'virtual',
    controlMode: 'auto',
    maintenanceNotes: '',
  });

  // Calculate used physical channels
  const usedChannels = useMemo(() => {
    return streetlights
      .filter((l) => l.hardwareStatus === 'physical' && l.relayChannel !== null)
      .map((l) => l.relayChannel as number);
  }, [streetlights]);

  // Filtered and searched records
  const filteredStreetlights = useMemo(() => {
    return streetlights.filter((light) => {
      // Search
      const matchesSearch =
        light.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        light.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        light.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `ward ${light.ward}`.includes(searchQuery.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'ON') matchesStatus = light.state === 'ON';
      if (statusFilter === 'OFF') matchesStatus = light.state === 'OFF';
      if (statusFilter === 'HEALTHY') matchesStatus = light.healthStatus === 'HEALTHY';
      if (statusFilter === 'FAULTY') matchesStatus = light.healthStatus === 'CRITICAL' || light.healthStatus === 'WARNING';
      if (statusFilter === 'OFFLINE') matchesStatus = light.healthStatus === 'OFFLINE';

      // Ward filter
      const matchesWard = wardFilter === 'ALL' || light.ward === Number(wardFilter);

      // Hardware filter
      const matchesHardware = hardwareFilter === 'ALL' || light.hardwareStatus === hardwareFilter;

      return matchesSearch && matchesStatus && matchesWard && matchesHardware;
    });
  }, [streetlights, searchQuery, statusFilter, wardFilter, hardwareFilter]);

  const handleOpenAdd = () => {
    setFormData({
      name: `Streetlight Node ${streetlights.length + 1}`,
      ward: 1,
      streetName: 'Tagore Road Extn, Sector 2',
      latitude: 23.075 + Math.random() * 0.015,
      longitude: 70.132 + Math.random() * 0.015,
      controllerId: 'ESP32-GMC-01',
      relayChannel: null, // Default to virtual if channels 1-6 are occupied
      hardwareStatus: usedChannels.length < 6 ? 'physical' : 'virtual',
      controlMode: 'auto',
      maintenanceNotes: 'Registered via Municipal Central Control Portal.',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addStreetlight(formData);
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (light: Streetlight) => {
    setEditingLight(light);
    setFormData({
      name: light.name,
      ward: light.ward,
      streetName: light.streetName,
      latitude: light.latitude,
      longitude: light.longitude,
      controllerId: light.controllerId,
      relayChannel: light.relayChannel,
      hardwareStatus: light.hardwareStatus,
      controlMode: light.controlMode,
      maintenanceNotes: light.maintenanceNotes || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLight) {
      updateStreetlight(editingLight.id, formData);
      setEditingLight(null);
    }
  };

  const handleDelete = (light: Streetlight) => {
    if (
      confirm(
        `Are you sure you want to delete ${light.name} (${light.id})? Historical readings will be retained in audit logs.`
      )
    ) {
      deleteStreetlight(light.id);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'GMC_Streetlight_Registry',
      filteredStreetlights,
      [
        { header: 'Streetlight ID', key: 'id' },
        { header: 'Pole / Mast Name', key: 'name' },
        { header: 'Ward Number', key: 'ward' },
        { header: 'Street Name', key: 'streetName' },
        { header: 'Latitude', key: 'latitude' },
        { header: 'Longitude', key: 'longitude' },
        { header: 'Controller ID', key: 'controllerId' },
        { header: 'Relay Channel', key: (l) => l.relayChannel || 'Virtual' },
        { header: 'Hardware Type', key: 'hardwareStatus' },
        { header: 'Current State', key: 'state' },
        { header: 'Health Status', key: 'healthStatus' },
        { header: 'Voltage (V)', key: 'voltage' },
        { header: 'Current (A)', key: 'current' },
        { header: 'Instant Power (W)', key: 'power' },
        { header: 'Energy (kWh)', key: 'energyKWh' },
        { header: 'Ambient Light (Lux)', key: 'ambientLight' },
        { header: 'Last Comm Timestamp', key: 'lastCommunication' },
        { header: 'Maintenance Notes', key: 'maintenanceNotes' },
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Action and Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, road, or ward..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filters and CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ON">Currently ON</option>
            <option value="OFF">Currently OFF</option>
            <option value="HEALTHY">Healthy Only</option>
            <option value="FAULTY">Faulty / Alert</option>
            <option value="OFFLINE">Offline</option>
          </select>

          {/* Ward Filter */}
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Wards (1-5)</option>
            <option value="1">Ward 1 (Oslo / Tagore)</option>
            <option value="2">Ward 2 (Port Road)</option>
            <option value="3">Ward 3 (Railway Stn)</option>
            <option value="4">Ward 4 (Zanda Chowk)</option>
            <option value="5">Ward 5 (Rotary Circle)</option>
          </select>

          {/* Hardware Filter */}
          <select
            value={hardwareFilter}
            onChange={(e) => setHardwareFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Hardware</option>
            <option value="physical">Physical Relays (1-6)</option>
            <option value="virtual">Virtual / Extension Nodes</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            title="Export Streetlight Records to CSV"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>

          {/* Add Streetlight (Admin Only) */}
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-glow-cyan transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Streetlight
            </button>
          )}
        </div>
      </div>

      {/* Streetlights Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A]/90 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1120] border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">ID & Pole Name</th>
                <th className="px-4 py-3">Ward & Street</th>
                <th className="px-4 py-3">Hardware / Channel</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3 font-mono">Current (A)</th>
                <th className="px-4 py-3 font-mono">Voltage (V)</th>
                <th className="px-4 py-3 font-mono">Power (W)</th>
                <th className="px-4 py-3 font-mono">Energy (kWh)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredStreetlights.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No streetlights match the selected filters or search query.
                  </td>
                </tr>
              ) : (
                filteredStreetlights.map((light) => {
                  const isOn = light.state === 'ON';
                  return (
                    <tr
                      key={light.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ID & Name */}
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {light.id}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {light.name}
                        </div>
                      </td>

                      {/* Ward & Street */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-200">Ward {light.ward}</span>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {light.streetName}
                        </div>
                      </td>

                      {/* Hardware Status */}
                      <td className="px-4 py-3">
                        <HardwareBadge
                          status={light.hardwareStatus}
                          channel={light.relayChannel}
                        />
                      </td>

                      {/* State */}
                      <td className="px-4 py-3">
                        <StateBadge state={light.state} />
                      </td>

                      {/* Health */}
                      <td className="px-4 py-3">
                        <HealthBadge status={light.healthStatus} />
                      </td>

                      {/* Current */}
                      <td className="px-4 py-3 font-mono font-medium text-slate-200">
                        {light.current.toFixed(3)} A
                      </td>

                      {/* Voltage */}
                      <td className="px-4 py-3 font-mono font-medium text-slate-200">
                        {light.voltage.toFixed(2)} V
                      </td>

                      {/* Power */}
                      <td className="px-4 py-3 font-mono font-semibold text-cyan-300">
                        {light.power.toFixed(2)} W
                      </td>

                      {/* Energy */}
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {light.energyKWh.toFixed(3)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle ON/OFF */}
                          <button
                            onClick={() => toggleStreetlight(light.id)}
                            className={`p-1.5 rounded transition-colors ${isOn
                              ? 'text-cyan-400 hover:bg-cyan-950/50'
                              : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                              }`}
                            title={isOn ? 'Turn OFF' : 'Turn ON'}
                          >
                            <Power className="h-4 w-4" />
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => onNavigateToDetails(light.id)}
                            className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                            title="View Full Diagnostics & Historical Charts"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEdit(light)}
                              className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                              title="Edit Streetlight Metadata"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(light)}
                              className="p-1.5 rounded text-slate-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                              title="Delete Streetlight"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="bg-[#0B1120] px-4 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div>
            Showing <span className="font-bold text-white">{filteredStreetlights.length}</span> of{' '}
            <span className="font-bold text-white">{streetlights.length}</span> streetlights
          </div>
          <div className="font-mono text-slate-500">
            Physical ESP32 Channels Occupied: {usedChannels.length} / 6
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isAddModalOpen || editingLight !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLight(null);
        }}
        title={editingLight ? `Edit Streetlight — ${editingLight.id}` : 'Register New Municipal Streetlight'}
        subtitle="Configure physical relay assignment, geographical coordinates, and municipal ward"
      >
        <form onSubmit={editingLight ? handleSaveEdit : handleSaveAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Pole / Mast Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ward Number</label>
              <select
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: Number(e.target.value) })}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
              >
                <option value={1}>Ward 1 (Oslo Circle / Tagore Rd)</option>
                <option value={2}>Ward 2 (Kandla Port Highway)</option>
                <option value={3}>Ward 3 (Railway Station Area)</option>
                <option value={4}>Ward 4 (Zanda Chowk Market)</option>
                <option value={5}>Ward 5 (Rotary Circle Peripheral)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Street / Road Name</label>
              <input
                type="text"
                value={formData.streetName}
                onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Latitude</label>
              <input
                type="number"
                step="0.00001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Longitude</label>
              <input
                type="number"
                step="0.00001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Hardware Allocation</label>
              <select
                value={formData.hardwareStatus}
                onChange={(e) => {
                  const status = e.target.value as HardwareStatus;
                  setFormData({
                    ...formData,
                    hardwareStatus: status,
                    relayChannel: status === 'physical' ? (formData.relayChannel || 1) : null,
                  });
                }}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
              >
                <option value="physical">Physical ESP32 Relay</option>
                <option value="virtual">Virtual Streetlight Node</option>
                <option value="unassigned">Unassigned / Spare</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Relay Channel (1 to 6)</label>
              <select
                disabled={formData.hardwareStatus !== 'physical'}
                value={formData.relayChannel || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    relayChannel: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white font-mono disabled:opacity-40"
              >
                <option value="">None (Virtual)</option>
                {[1, 2, 3, 4, 5, 6].map((ch) => (
                  <option key={ch} value={ch}>
                    Relay Channel {ch} {usedChannels.includes(ch) ? '(Currently Allocated)' : '(Free)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Maintenance Notes</label>
            <textarea
              rows={2}
              value={formData.maintenanceNotes}
              onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingLight(null);
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950"
            >
              {editingLight ? 'Save Changes' : 'Register Streetlight'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

