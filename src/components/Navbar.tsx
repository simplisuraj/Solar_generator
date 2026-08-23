import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Sparkles,
  RefreshCw,
  Sliders,
  History,
  Archive,
  Layers,
  Activity
} from 'lucide-react';
import { ActiveViewTab, OperatingMode } from '../types';

interface NavbarProps {
  hasGeminiKey: boolean;
  onReset: () => void;
  isProcessing: boolean;
  activeTab: ActiveViewTab;
  onSelectTab: (tab: ActiveViewTab) => void;
  operatingMode: OperatingMode;
  onToggleMode: (mode: OperatingMode) => void;
  totalParsedPct: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasGeminiKey,
  onReset,
  isProcessing,
  activeTab,
  onSelectTab,
  operatingMode,
  onToggleMode,
  totalParsedPct
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Workspace Path */}
        <div className="flex items-center space-x-3.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-xs">
            <span className="text-base font-black tracking-wider text-white">₹</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold text-base tracking-tight">Credit Appraisal Studio</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wide">
                V11 Engine
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <span>Workspace</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300 font-medium">Page-Level Ingestion & Evidence-First Appraisal</span>
            </div>
          </div>
        </div>

        {/* Center/Right: Mode Toggle & Navigation Shortcuts */}
        <div className="flex items-center space-x-2.5">
          {/* Operating Mode Selector */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => onToggleMode('production')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                operatingMode === 'production'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Strict zero-mock production mode"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Production
            </button>
            <button
              onClick={() => onToggleMode('demo')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                operatingMode === 'demo'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Interactive sample dossiers with pre-loaded cases"
            >
              <span>🧪</span>
              Demo Mode
            </button>
          </div>

          {/* Quick Access to Export Centre & Audit Log */}
          <button
            onClick={() => onSelectTab('export_centre')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 border transition cursor-pointer ${
              activeTab === 'export_centre'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Export Centre"
          >
            <Archive className="w-4 h-4" />
            <span className="hidden md:inline">Exports</span>
          </button>

          <button
            onClick={() => onSelectTab('audit_log')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 border transition cursor-pointer ${
              activeTab === 'audit_log'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Audit Log"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Audit</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 border transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Parser Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* AI Engine Status */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-md border border-slate-700/80 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300 font-medium hidden sm:inline">Gemini 3.7</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasGeminiKey ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-indigo-400 ring-2 ring-indigo-400/20'
              }`}
              title={hasGeminiKey ? 'Gemini API Key Connected' : 'Auto Local / Server Engine active'}
            />
          </div>

          {/* Reset button */}
          <button
            onClick={onReset}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title="Reset Workspace"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
