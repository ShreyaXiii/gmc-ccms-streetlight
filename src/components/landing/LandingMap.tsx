import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCCMS } from '../../context/CCMSContext';
import { ArrowRight, Maximize2 } from 'lucide-react';

interface LandingMapProps {
  onOpenMap: () => void;
}

export const LandingMap: React.FC<LandingMapProps> = ({ onOpenMap }) => {
  const { streetlights } = useCCMS();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Gandhidham Coordinates: 23.0760° N, 70.1350° E
    const map = L.map(mapContainerRef.current, {
      center: [23.0760, 70.1350],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: true,
    });

    // Satellite Imagery tile layer with subtle dark filter
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
      }
    ).addTo(map);

    // Render registered streetlight markers
    streetlights.slice(0, 14).forEach((light) => {
      const isCritical = light.healthStatus === 'CRITICAL' || (light.lastFaultType && light.lastFaultType !== 'NONE');
      const isHealthy = !isCritical && light.state === 'ON';

      const markerHtml = isCritical
        ? `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: #EF4444; opacity: 0.5;" class="animate-ping"></div>
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: #DC2626; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(239,68,68,0.9);">
              <span style="color: white; font-weight: 900; font-size: 13px; line-height: 1;">!</span>
            </div>
          </div>
        `
        : `
          <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: #10B981; opacity: 0.35;" class="animate-pulse"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #10B981; border: 2px solid #FFFFFF; box-shadow: 0 0 10px #10B981; display: flex; align-items: center; justify-content: center;">
              <div style="width: 4px; height: 4px; border-radius: 50%; background: white;"></div>
            </div>
          </div>
        `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'landing-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([light.latitude, light.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="color: #0F172A; font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: bold; margin-bottom: 2px;">${light.name}</div>
            <div style="color: #64748B;">Ward ${light.ward} • ${isCritical ? '⚠️ FAULT DETECTED' : '✅ Operational'}</div>
          </div>
        `);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [streetlights]);

  return (
    <div className="relative w-full h-[230px] rounded-xl overflow-hidden border border-slate-700/60 shadow-inner group">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Subtle Dark Vignette Overlay for aesthetic match */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071324]/80 via-transparent to-[#071324]/30" />

      {/* Gandhidham City Center Pill Label */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-8 z-[400]">
        <div className="px-3 py-1 rounded-md bg-[#071426]/90 border border-cyan-500/40 text-[11px] font-bold text-white shadow-lg backdrop-blur-sm tracking-wide">
          Gandhidham
        </div>
      </div>

      {/* Open Map CTA Button on Bottom Left */}
      <div className="absolute bottom-3 left-3 z-[400]">
        <button
          onClick={onOpenMap}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#07172C]/90 hover:bg-cyan-600 border border-cyan-500/50 hover:border-cyan-400 text-xs font-semibold text-white transition-all shadow-md backdrop-blur-md group-hover:shadow-glow-cyan"
        >
          <span>Open Map</span>
          <ArrowRight className="h-3.5 w-3.5 text-cyan-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Fullscreen Expand Icon on Bottom Right */}
      <div className="absolute bottom-3 right-3 z-[400]">
        <button
          onClick={onOpenMap}
          title="Expand Gandhidham GIS Map"
          className="p-1.5 rounded-lg bg-[#07172C]/80 hover:bg-cyan-600/80 border border-slate-600/50 text-slate-300 hover:text-white transition-colors backdrop-blur-sm"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
