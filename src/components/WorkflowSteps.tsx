import React from 'react';
import {
  Upload,
  Activity,
  FileSearch,
  BookOpen,
  ShieldAlert,
  GitCompare,
  FileCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ActiveViewTab } from '../types';

interface WorkflowStepsProps {
  currentTab: ActiveViewTab;
  onTabClick: (tab: ActiveViewTab) => void;
  statusMap: {
    documents: boolean;
    parsing: { total: number; success: number; failed: number };
    intelligence: boolean;
    extraction: { found: number; total: number };
    reconciliation: { total: number; conflicts: number };
    validation: { pass: boolean; blockingCount: number };
    mailMerge: boolean;
  };
}

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  currentTab,
  onTabClick,
  statusMap
}) => {
  const steps: {
    id: ActiveViewTab;
    num: string;
    label: string;
    icon: any;
    desc: string;
    badge?: React.ReactNode;
  }[] = [
    {
      id: 'documents',
      num: '01',
      label: 'Document Intake',
      icon: Upload,
      desc: 'PDF ingestion & case structure',
      badge: statusMap.documents ? (
        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">Uploaded</span>
      ) : null
    },
    {
      id: 'parsing_monitor',
      num: '02',
      label: 'Page Parser Monitor',
      icon: Activity,
      desc: 'LED progress & page cache',
      badge:
        statusMap.parsing.total > 0 ? (
          statusMap.parsing.failed > 0 ? (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 animate-pulse">
              🔴 {statusMap.parsing.failed} Failed
            </span>
          ) : statusMap.parsing.success === statusMap.parsing.total ? (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
              🟢 {statusMap.parsing.success}/{statusMap.parsing.total}
            </span>
          ) : (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-700">
              🟠 {statusMap.parsing.success}/{statusMap.parsing.total}
            </span>
          )
        ) : null
    },
    {
      id: 'dashboard',
      num: '03',
      label: 'Doc Intelligence',
      icon: FileSearch,
      desc: 'Checklist matrix & stage inference',
      badge: statusMap.intelligence ? (
        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">Ready</span>
      ) : null
    },
    {
      id: 'extraction',
      num: '04',
      label: 'Data Extraction',
      icon: BookOpen,
      desc: '17 sections with page citations',
      badge:
        statusMap.extraction.found > 0 ? (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-mono">
            {statusMap.extraction.found}/{statusMap.extraction.total}
          </span>
        ) : null
    },
    {
      id: 'reconciliation',
      num: '05',
      label: 'Reconciliation',
      icon: GitCompare,
      desc: 'Cross-document conflict resolver',
      badge:
        statusMap.reconciliation.conflicts > 0 ? (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
            ⚠️ {statusMap.reconciliation.conflicts} Conflicts
          </span>
        ) : statusMap.reconciliation.total > 0 ? (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
            Consistent
          </span>
        ) : null
    },
    {
      id: 'validation',
      num: '06',
      label: 'Validation Gate',
      icon: ShieldAlert,
      desc: 'Policy, arithmetic & gate checks',
      badge:
        statusMap.validation.blockingCount > 0 ? (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
            ⛔ {statusMap.validation.blockingCount} Blocking
          </span>
        ) : statusMap.validation.pass ? (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
            Passed
          </span>
        ) : null
    },
    {
      id: 'mail_merge',
      num: '07',
      label: 'Mail Merge',
      icon: FileCheck,
      desc: 'Exact-template proposal note',
      badge: statusMap.mailMerge ? (
        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">Patched</span>
      ) : null
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentTab === step.id;

            return (
              <button
                key={step.id}
                onClick={() => onTabClick(step.id)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {step.badge || (
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      {step.num}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-bold truncate ${
                    isActive ? 'text-indigo-950' : 'text-slate-900'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-500 truncate mt-0.5 font-normal">
                  {step.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
