import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import {
  History,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  FileCode,
  Zap
} from 'lucide-react';
import { exportAuditLogsCsv, downloadJson } from '../lib/exportEngine';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.document_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.user_action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('SUCCEEDED') || action.includes('GENERATED') || action.includes('STITCHED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('FAILED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('RETRIED') || action.includes('STARTED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <RotateCcw className="w-3 h-3" /> {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <Zap className="w-3 h-3" /> {action}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Export Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Governance & Ingestion Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological record of all document parser operations, retries, and extraction runs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAuditLogsCsv(logs)}
            disabled={logs.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => downloadJson(logs, 'audit_log.json')}
            disabled={logs.length === 0}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions, documents, page numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            <option value="PAGE_SUCCEEDED">Page Succeeded</option>
            <option value="PAGE_FAILED">Page Failed</option>
            <option value="PAGE_RETRIED">Page Retried</option>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="DOCUMENT_STITCHED">Document Stitched</option>
            <option value="JSON_GENERATED">JSON Generated</option>
            <option value="VALIDATION_EXECUTED">Validation Executed</option>
            <option value="MAIL_MERGE_GENERATED">Mail Merge Generated</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Document & Target</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{getActionBadge(log.user_action)}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        {log.document_name || log.document_id || 'System Engine'}
                      </span>
                      {log.page !== undefined && (
                        <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Page {log.page}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-md truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
