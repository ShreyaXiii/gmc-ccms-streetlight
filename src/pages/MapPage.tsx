import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCCMS } from '../context/CCMSContext';
import { HealthBadge, StateBadge } from '../components/common/Badge';
import {
  MapPin,
  Filter,
  AlertTriangle,
  ExternalLink,
  Crosshair,
  Search,
  Eye,
  Info,
} from 'lucide-react';

interface MapPageProps {
  onNavigateToDetails: (lightId: string) => void;
  focusedLightId?: string;
}

export const MapPage: React.FC<MapPageProps> = ({
  onNavigateToDetails,
  focusedLightId,
}) => {
  const { streetlights, faults, updateStreetlight } = useCCMS();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLightId, setSelectedLightId] = useState<string | null>(focusedLightId || null);

  // Faulty lights list
  const faultyLights = streetlights.filter(
    (l) => l.healthStatus === 'CRITICAL' || l.healthStatus === 'WARNING'
  );

  // Filtered streetlights
  const visibleLights = streetlights.filter((l) => {
    if (wardFilter !== 'ALL' && l.ward !== Number(wardFilter)) return false;
    if (statusFilter === 'ON' && l.state !== 'ON') return false;
    if (statusFilter === 'OFF' && l.state !== 'OFF') return false;
    if (statusFilter === 'FAULTY' && l.healthStatus === 'HEALTHY') return false;
    if (statusFilter === 'HEALTHY' && l.healthStatus !== 'HEALTHY') return false;
    return true;
  });

  // Create custom marker icon based on status
  const createMarkerIcon = (light: (typeof streetlights)[0], isSelected: boolean) => {
    let color = '#10B981'; // Green for healthy ON
    let pulseClass = '';

    if (light.healthStatus === 'CRITICAL') {
      color = '#EF4444'; // Red for fault
      pulseClass = 'animate-ping';
    } else if (light.healthStatus === 'WARNING') {
      color = '#F59E0B'; // Amber
    } else if (light.healthStatus === 'OFFLINE') {
      color = '#64748B'; // Slate
    } else if (light.state === 'OFF') {
      color = '#38BDF8'; // Sky blue for healthy OFF
    }

    const svgHtml = `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        ${
          light.healthStatus === 'CRITICAL'
            ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.4;" class="${pulseClass}"></div>`
            : ''
        }
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #0B1120;
          border: 3px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 ${isSelected ? '14px' : '8px'} ${color};
          transform: scale(${isSelected ? 1.25 : 1});
          transition: transform 0.2s ease;
        ">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
        </div>
      </div>
    `;

    return L.divIcon({
      html: svgHtml,
      className: 'custom-leaflet-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Gandhidham Center: 23.0753° N, 70.1337° E
      const map = L.map(mapContainerRef.current, {
        center: [23.0760, 70.1350],
        zoom: 14,
        zoomControl: true,
      });

      // Free standard OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | GMC CCMS',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Add markers for visible streetlights
    visibleLights.forEach((light) => {
      const isSelected = light.id === selectedLightId;
      const marker = L.marker([light.latitude, light.longitude], {
        icon: createMarkerIcon(light, isSelected),
        title: `${light.id} - ${light.name}`,
      }).addTo(map);

      // Popup HTML content
      const popupContent = `
        <div style="min-width: 200px; font-family: Inter, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #38BDF8; font-size: 13px;">${light.id}</strong>
            <span style="font-size: 11px; color: ${
              light.state === 'ON' ? '#34D399' : '#94A3B8'
            }; font-weight: bold;">${light.state}</span>
          </div>
          <div style="font-size: 11px; color: #CBD5E1; margin-bottom: 4px;"><strong>${light.name}</strong></div>
          <div style="font-size: 10px; color: #94A3B8; margin-bottom: 8px;">Ward ${light.ward} • ${light.streetName}</div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; background: #070B14; padding: 6px; border-radius: 6px; margin-bottom: 8px;">
            <div><span style="color: #64748B;">I:</span> <strong style="color: #E2E8F0;">${light.current.toFixed(3)} A</strong></div>
            <div><span style="color: #64748B;">V:</span> <strong style="color: #E2E8F0;">${light.voltage.toFixed(2)} V</strong></div>
            <div><span style="color: #64748B;">P:</span> <strong style="color: #38BDF8;">${light.power.toFixed(2)} W</strong></div>
            <div><span style="color: #64748B;">Relay:</span> <strong style="color: #E2E8F0;">CH ${light.relayChannel || 'V'}</strong></div>
          </div>
          
          <button id="btn-details-${light.id}" style="
            width: 100%;
            background: #0284C7;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            padding: 5px 8px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">
            View Live Diagnostics →
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        setSelectedLightId(light.id);
        const btn = document.getElementById(`btn-details-${light.id}`);
        if (btn) {
          btn.onclick = () => onNavigateToDetails(light.id);
        }
      });

      markersRef.current[light.id] = marker;
    });

    // If focused light passed
    if (focusedLightId && markersRef.current[focusedLightId]) {
      const targetLight = streetlights.find((l) => l.id === focusedLightId);
      if (targetLight) {
        map.setView([targetLight.latitude, targetLight.longitude], 16, { animate: true });
        markersRef.current[focusedLightId].openPopup();
      }
    }
  }, [visibleLights, selectedLightId, focusedLightId]);

  const handleFocusLight = (light: (typeof streetlights)[0]) => {
    setSelectedLightId(light.id);
    if (mapInstanceRef.current && markersRef.current[light.id]) {
      mapInstanceRef.current.setView([light.latitude, light.longitude], 16, { animate: true });
      markersRef.current[light.id].openPopup();
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || visibleLights.length === 0) return;
    const group = L.featureGroup(Object.values(markersRef.current));
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15));
  };

  return (
    <div className="space-y-4">
      {/* Filters and Controls Strip */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-cyan-400" />
            Map Filters:
          </span>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-slate-300"
          >
            <option value="ALL">All Gandhidham Wards</option>
            <option value="1">Ward 1 (Oslo / Tagore Road)</option>
            <option value="2">Ward 2 (Port Road Corridor)</option>
            <option value="3">Ward 3 (Railway Station Approach)</option>
            <option value="4">Ward 4 (Zanda Chowk Market)</option>
            <option value="5">Ward 5 (Rotary Circle Peripheral)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-slate-300"
          >
            <option value="ALL">All Light States</option>
            <option value="ON">Currently ON</option>
            <option value="OFF">Currently OFF</option>
            <option value="FAULTY">Fault / Alert Markers</option>
            <option value="HEALTHY">Healthy Only</option>
          </select>

          <button
            onClick={handleFitAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
            Fit All Nodes
          </button>
        </div>

        {/* Marker Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span>Healthy (ON)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            <span>Healthy (OFF)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Critical Fault</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>Warning</span>
          </div>
        </div>
      </div>

      {/* Main Map & Fault List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Canvas */}
        <div className="lg:col-span-3 rounded-xl border border-slate-800 overflow-hidden shadow-xl h-[620px] relative">
          <div ref={mapContainerRef} className="h-full w-full z-10" />

          {/* Quick Notice Overlay */}
          <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 backdrop-blur shadow-md flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            <span>Gandhidham, Gujarat (Lat 23.076°, Lon 70.135°)</span>
          </div>
        </div>

        {/* Sidebar: Fault List & Focus Panel */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 flex flex-col justify-between h-[620px]">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                Active Fault Alerts
              </h3>
              <span className="font-mono text-xs text-rose-400 font-bold">
                {faultyLights.length}
              </span>
            </div>

            {faultyLights.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 rounded-lg bg-emerald-950/20 border border-emerald-500/20 mt-2">
                <p className="font-semibold text-emerald-400">All Nodes Healthy</p>
                <p className="text-[11px] text-slate-500 mt-1">Zero active circuit or lamp alerts.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1">
                {faultyLights.map((light) => (
                  <div
                    key={light.id}
                    onClick={() => handleFocusLight(light)}
                    className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">{light.id}</span>
                      <span className="text-[10px] text-rose-400 font-bold uppercase">
                        {light.lastFaultType || 'FAULT'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5 truncate">{light.name}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Relay CH {light.relayChannel || 'V'}</span>
                      <span className="text-cyan-400 font-semibold hover:underline">Focus on Map →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gandhidham GIS Coordinates quick lookup */}
          <div className="border-t border-slate-800 pt-3 text-xs">
            <p className="font-semibold text-slate-300 mb-2">Streetlight Focus Directory:</p>
            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
              {streetlights.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleFocusLight(l)}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-[11px] transition-colors ${
                    selectedLightId === l.id
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{l.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">CH {l.relayChannel || 'V'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

