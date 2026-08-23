import React from 'react';
import {
  Sparkles,
  Sliders,
  History,
  Archive
} from 'lucide-react';
import { ActiveViewTab } from '../types';

interface NavbarProps {
  activeTab: ActiveViewTab;
  onSelectTab: (tab: ActiveViewTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab
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

        {/* Center/Right: Navigation Shortcuts */}
        <div className="flex items-center space-x-2.5">
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
        </div>
      </div>
    </header>
  );
};
