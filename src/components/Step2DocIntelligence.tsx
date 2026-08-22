import React from 'react';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ClassifiedDocument, ProjectStageInfo, ChecklistRow } from '../types';

interface Step2DocIntelligenceProps {
  classifiedDocs: ClassifiedDocument[];
  stageInfo: ProjectStageInfo | null;
  checklistRows: ChecklistRow[];
  onRunClassification: () => void;
  onNext: () => void;
  isProcessing: boolean;
  fileCount: number;
}

export const Step2DocIntelligence: React.FC<Step2DocIntelligenceProps> = ({
  classifiedDocs,
  stageInfo,
  checklistRows,
  onRunClassification,
  onNext,
  isProcessing,
  fileCount,
}) => {
  const requiredMissing = checklistRows.filter((r) => r.Status === 'REQUIRED');
  const presentDocs = checklistRows.filter((r) => r.Status === 'PRESENT');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              STAGE 2: DOCUMENT INTELLIGENCE
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Checklist Mapping & Project Stage Detection
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Classifies each intake file against the bank's approved 35-point project finance checklist, detects project execution stage (Commissioned / Under-construction / Pre-construction), and audits documentation gaps.
          </p>
        </div>

        <button
          onClick={onRunClassification}
          disabled={fileCount === 0 || isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{classifiedDocs.length > 0 ? 'Re-run Document Intelligence' : 'Classify Documents & Build Checklist'}</span>
        </button>
      </div>

      {/* When classification hasn't been run yet */}
      {classifiedDocs.length === 0 && !isProcessing && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileSearch className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Document Intelligence Not Yet Executed
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Click the button below to run Gemini document classification on the {fileCount} ingested documents and evaluate proposal readiness.
          </p>
          <button
            onClick={onRunClassification}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Classify Documents Now</span>
          </button>
        </div>
      )}

      {/* Stage & Summary KPI Cards */}
      {stageInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Inferred Project Stage
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-slate-900 capitalize">
                {stageInfo.project_stage.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase mb-1">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 truncate" title={stageInfo.reason}>
              {stageInfo.reason}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Facility / Funding Type
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-slate-900">
                {stageInfo.reimbursement_case ? 'Reimbursement' : 'Direct Capex'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {stageInfo.reimbursement_case
                ? 'Mandatory CA Utilisation & Invoices Required'
                : 'Standard milestone payment schedule'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Checklist Compliance
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-slate-900">
                {presentDocs.length} / {checklistRows.length}
              </span>
              <span className="text-emerald-500 text-xs font-medium mb-1">
                {((presentDocs.length / checklistRows.length) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Stage document readiness score
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Mandatory Gaps
            </div>
            <div className="flex items-end space-x-2">
              <span
                className={`text-2xl font-bold ${
                  requiredMissing.length === 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {requiredMissing.length === 0 ? '0 Missing' : `${requiredMissing.length} Missing`}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${
                  requiredMissing.length === 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {requiredMissing.length === 0 ? 'Optimal' : 'Action Req'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {requiredMissing.length === 0
                ? 'All required documents verified'
                : 'Missing documents required before sanction'}
            </p>
          </div>
        </div>
      )}

      {/* Classified Documents List */}
      {classifiedDocs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Classified Source Documents ({classifiedDocs.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Source File</th>
                  <th className="px-6 py-3">Detected Document Type</th>
                  <th className="px-6 py-3">Group</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Confidence</th>
                  <th className="px-6 py-3">Key Extracted Outputs</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {classifiedDocs.map((doc, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {doc.filename}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-indigo-600">
                      {doc.document_type}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {doc.group}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          doc.priority === 'Mandatory'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {doc.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${doc.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                          {(doc.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {doc.key_outputs?.join(', ') || doc.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 35-Point Banking Proposal Checklist Gap Matrix */}
      {checklistRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Bank Proposal Document Checklist Gap Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates documentation readiness against RBI and internal Credit Risk Management Department mandates.
              </p>
            </div>
            {requiredMissing.length > 0 ? (
              <span className="text-[10px] bg-amber-100 text-amber-700 uppercase font-bold px-3 py-1 rounded flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {requiredMissing.length} Required Document(s) Missing
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 uppercase font-bold px-3 py-1 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Stage Requirements Satisfied
              </span>
            )}
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Group</th>
                  <th className="px-6 py-3">Required Document</th>
                  <th className="px-6 py-3">Priority Rule</th>
                  <th className="px-6 py-3">Readiness Status</th>
                  <th className="px-6 py-3">Primary Expected Outputs</th>
                  <th className="px-6 py-3">Matched File(s)</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {checklistRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-slate-700 text-xs">
                      {row.Group}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {row.Document}
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {row.Priority}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] tracking-wider uppercase ${
                          row.Status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : row.Status === 'REQUIRED'
                            ? 'bg-rose-100 text-rose-700 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.Status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {row['Main outputs']}
                    </td>
                    <td className="px-6 py-3 text-slate-800 font-mono text-xs">
                      {row['Matched files'] || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Ready to extract canonical proposal data dictionary across 17 structured banking sections.
            </span>
            <button
              onClick={onNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Proceed to Dictionary Extraction</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
