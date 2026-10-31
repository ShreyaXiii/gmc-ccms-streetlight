import React from 'react';
import { X, Play, Cpu, ShieldCheck, Zap, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterDashboard: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, onEnterDashboard }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#091528] border border-cyan-500/30 p-6 md:p-8 shadow-2xl text-left overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Play className="h-5 w-5 fill-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">GMC CCMS Interactive Demonstration</h3>
              <p className="text-xs text-slate-400">Smart City Public Street Lighting IoT Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video / Interactive Preview Simulation Box */}
        <div className="my-6 rounded-xl border border-slate-700/60 bg-[#060D1A] p-5 relative overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-[#0B172E] border border-cyan-500/20">
              <span className="text-[10px] text-cyan-400 font-mono uppercase">Gateway</span>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                ESP32 Online
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0B172E] border border-cyan-500/20">
              <span className="text-[10px] text-cyan-400 font-mono uppercase">Control Relays</span>
              <div className="text-sm font-bold text-white mt-0.5">6 Channels</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0B172E] border border-cyan-500/20">
              <span className="text-[10px] text-cyan-400 font-mono uppercase">Sensors</span>
              <div className="text-sm font-bold text-white mt-0.5">Current + LDR</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0B172E] border border-cyan-500/20">
              <span className="text-[10px] text-cyan-400 font-mono uppercase">Fault Engine</span>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">Active & Safe</div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The Gandhidham Municipal Corporation Centralized Control & Monitoring System connects physical and virtual streetlights to a centralized municipal control room. Features include autonomous LDR photocell switching, real-time current diagnostics, instant open-circuit and overcurrent tripping, and Gujarat PGVCL tariff energy accounting.
          </p>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-cyan-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" /> Real-time telemetry
            </span>
            <span className="flex items-center gap-1 text-cyan-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" /> Auto daytime cutoff
            </span>
            <span className="flex items-center gap-1 text-cyan-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" /> Zero fake data in real mode
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEnterDashboard();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all"
          >
            <span>Launch Live Control Room</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface InfoModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const InfoModal: React.FC<InfoModalProps> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#091528] border border-cyan-500/30 p-6 md:p-8 shadow-2xl text-left">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="my-5 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          {children}
        </div>
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

