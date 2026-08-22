import React from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Download,
  ArrowRight,
  ShieldAlert,
  Info,
  Check,
  X
} from 'lucide-react';
import { ReconciliationItem, ReconciliationSummary } from '../types';

interface Step5ReconciliationProps {
  reconciliations: ReconciliationItem[];
  onRunReconciliation: () => void;
  onNext: () => void;
  onUpdateReconciliation: (fieldId: string, updated: Partial<ReconciliationItem>) => void;
  isProcessing: boolean;
  hasClassifiedDocs: boolean;
}

export const Step5Reconciliation: React.FC<Step5ReconciliationProps> = ({
  reconciliations,
  onRunReconciliation,
  onNext,
  onUpdateReconciliation,
  isProcessing,
  hasClassifiedDocs,
}) => {
  const summary: ReconciliationSummary = {
    consistent: reconciliations.filter((r) => r.status === 'consistent').length,
    conflict: reconciliations.filter((r) => r.status === 'conflict').length,
    single_source: reconciliations.filter((r) => r.status === 'single_source').length,
    insufficient_evidence: reconciliations.filter((r) => r.status === 'insufficient_evidence').length,
  };

  const handleDownloadJson = () => {
    const report = {
      generated_at: new Date().toISOString(),
      summary,
      items: reconciliations,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cross_document_reconciliation.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              STAGE 5: CROSS-DOCUMENT RECONCILIATION
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Cross-Document Reconciliation & Conflict Detection
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Compares identical proposal facts across PPA, LOA/RFS, DPR, Financial Model, CA Certificates, and Commissioning approvals. Conflicts are never silently resolved.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reconciliations.length > 0 && (
            <button
              onClick={handleDownloadJson}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-md border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Report JSON</span>
            </button>
          )}
          <button
            onClick={onRunReconciliation}
            disabled={!hasClassifiedDocs || isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{reconciliations.length > 0 ? 'Re-run Reconciliation' : 'Run Cross-Document Reconciliation'}</span>
          </button>
        </div>
      </div>

      {/* When no reconciliation run yet */}
      {reconciliations.length === 0 && !isProcessing && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <GitCompare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Cross-Document Reconciliation Not Yet Run
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Compare extracted values across PPA, LOA, DPR, CA Certificates, and Financial Model to identify multi-document agreement or conflicts.
          </p>
          <button
            onClick={onRunReconciliation}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Reconcile Document Set Now</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      {reconciliations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Consistent Facts
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-emerald-600">
                {summary.consistent}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase mb-1">
                Agreed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Confirmed by &gt;= 2 documents</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Unresolved Conflicts
            </div>
            <div className="flex items-end space-x-2">
              <span
                className={`text-2xl font-bold ${
                  summary.conflict > 0 ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                {summary.conflict}
              </span>
              {summary.conflict > 0 ? (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase mb-1">
                  Action Required
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase mb-1">
                  0 Conflicts
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Manual review before merge</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Single-Source Facts
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-slate-900">
                {summary.single_source}
              </span>
              <span className="text-slate-500 text-xs font-medium mb-1">Credible</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Sourced from 1 authoritative file</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Insufficient Evidence
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-slate-700">
                {summary.insufficient_evidence}
              </span>
              <span className="text-slate-500 text-xs font-medium mb-1">Absent</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Will become [MISSING]</p>
          </div>
        </div>
      )}

      {/* Reconciliation Table & Multi-Document Citations */}
      {reconciliations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Cross-Document Reconciliation Audit Trail ({reconciliations.length} facts)
            </h3>
            {summary.conflict === 0 ? (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-1 rounded flex items-center gap-1 uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" /> No Conflicts Detected
              </span>
            ) : (
              <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-1 rounded flex items-center gap-1 uppercase">
                <AlertTriangle className="w-3.5 h-3.5" /> {summary.conflict} Conflict(s) Require Decision
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {reconciliations.map((item) => (
              <div key={item.field_id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-indigo-700 px-2 py-0.5 rounded">
                      {item.field_id}
                    </span>
                    <h4 className="font-semibold text-sm text-slate-900">{item.label}</h4>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                        item.status === 'consistent'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.status === 'conflict'
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : item.status === 'single_source'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-500 font-medium">Preferred:</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {item.preferred_value !== null ? String(item.preferred_value) : 'null'}
                      </span>
                    </div>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        item.action === 'accept'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.action === 'manual_review'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.action.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-1">{item.reason}</p>

                {/* Multi-Document Evidence Cards */}
                {item.values && item.values.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {item.values.map((v, vIdx) => (
                      <div
                        key={vIdx}
                        className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span className="font-bold text-indigo-700 truncate max-w-[150px]">
                              {v.source}
                            </span>
                            <span className="bg-white border border-slate-200 px-1.5 rounded font-bold text-slate-800">
                              Val: {String(v.value)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 italic mt-1.5 line-clamp-2">
                            “{v.evidence}”
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              All facts cross-checked against source documents. Ready for exact-template intelligent mail merge.
            </span>
            <button
              onClick={onNext}
              disabled={summary.conflict > 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Proceed to Mail Merge & Final DOCX</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
