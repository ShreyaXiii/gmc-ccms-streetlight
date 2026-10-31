import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Lightbulb,
  MapPin,
  AlertTriangle,
  Zap,
  Wrench,
  Cpu,
  FileSpreadsheet,
  Settings,
  LogOut,
  Shield,
  X,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type PageId =
  | 'overview'
  | 'monitoring'
  | 'streetlights'
  | 'details'
  | 'map'
  | 'faults'
  | 'energy'
  | 'maintenance'
  | 'controllers'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
  unresolvedFaultCount: number;
  onNavigateToLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  isOpen,
  onClose,
  unresolvedFaultCount,
  onNavigateToLanding,
}) => {
  const { user, logout, isAdmin } = useAuth();

  const allNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
    { id: 'map', label: 'Gandhidham Map', icon: MapPin },
    { id: 'streetlights', label: 'Streetlights', icon: Lightbulb },
    {
      id: 'faults',
      label: 'Faults & Alerts',
      icon: AlertTriangle,
      badge: unresolvedFaultCount > 0 ? unresolvedFaultCount : undefined,
    },
    { id: 'energy', label: 'Energy Analytics', icon: Zap },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'controllers', label: 'ESP32 Controllers', icon: Cpu },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings & Security', icon: Settings },
  ];

  // Operator has strictly access to only: Gandhidham Map, Streetlight, Fault & Alerts
  const navItems = isAdmin
    ? allNavItems
    : allNavItems.filter((item) =>
        item.id === 'map' || item.id === 'streetlights' || item.id === 'faults'
      );

  const handleNavClick = (pageId: PageId) => {
    setActivePage(pageId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#090E1A] border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-slate-800/80 bg-[#0B1120]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-glow-cyan">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wide text-white">GMC CCMS</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  IoT v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Gandhidham Municipal Corp</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
            {isAdmin ? 'Administrator Navigation' : 'Operator Portal (Restricted)'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as PageId)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-400 border border-cyan-500/30 shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-glow-rose animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Operator Profile Strip */}
        <div className="border-t border-slate-800/80 p-4 bg-[#0B1120]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 font-bold font-mono">
                {user?.fullName.charAt(0) || 'O'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName}</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Shield className="h-3 w-3 text-cyan-400" />
                  <span className="capitalize">{user?.role}</span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout session"
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-900"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="w-full flex items-center justify-center gap-2 py-2 mb-2.5 rounded-lg bg-[#07172C] hover:bg-[#0A2244] border border-cyan-500/30 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-all shadow-sm"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>View Public Landing Page</span>
            </button>
          )}

          <div className="rounded bg-slate-900/90 border border-slate-800/80 px-2.5 py-1.5 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>SEVA FIRST 2026</span>
            <span className="text-cyan-400 font-semibold">GUJARAT GOV</span>
          </div>
        </div>
      </aside>
    </>
  );
};

