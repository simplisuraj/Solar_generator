import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Edit3,
  ExternalLink,
  Tag
} from 'lucide-react';
import { ExtractedField } from '../types';

interface Step3ExtractionProps {
  fields: ExtractedField[];
  onRunExtraction: () => void;
  onUpdateField: (fieldId: string, updated: Partial<ExtractedField>) => void;
  onSelectFieldDetail: (field: ExtractedField) => void;
  onNext: () => void;
  isProcessing: boolean;
  selectedSections: string[];
  onToggleSection: (section: string) => void;
  allSections: string[];
}

export const Step3Extraction: React.FC<Step3ExtractionProps> = ({
  fields,
  onRunExtraction,
  onUpdateField,
  onSelectFieldDetail,
  onNext,
  isProcessing,
  selectedSections,
  onToggleSection,
  allSections,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'missing' | 'review' | 'conflict'>('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  const availableCount = fields.filter((f) => f.status === 'available').length;
  const missingCount = fields.filter((f) => f.status === 'missing').length;
  const reviewCount = fields.filter((f) => f.status === 'review' || f.status === 'conflict').length;

  const filteredFields = fields.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (sectionFilter !== 'all' && f.section !== sectionFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = f.field_id.toLowerCase().includes(term);
      const matchLabel = f.label.toLowerCase().includes(term);
      const matchVal = String(f.value || '').toLowerCase().includes(term);
      const matchEvidence = f.evidence?.toLowerCase().includes(term);
      return matchId || matchLabel || matchVal || matchEvidence;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              STAGE 3: STRUCTURED EXTRACTION
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Proposal Data Dictionary Extraction
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Conservative AI extraction engine capturing 90+ banking parameters across 17 proposal sections with mandatory verbatim evidence snippets and exact document locators.
          </p>
        </div>

        <button
          onClick={onRunExtraction}
          disabled={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{fields.length > 0 ? 'Re-extract Data Dictionary' : 'Run Full Dictionary Extraction'}</span>
        </button>
      </div>

      {/* When no extraction has been run yet */}
      {fields.length === 0 && !isProcessing && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Data Dictionary Not Yet Extracted
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Run extraction to parse all 17 sections (Proposal, SPV, Ownership, Sponsor, Project, LOA, PPA, Land, Technical, PVSyst, EPC, O&M, Cost & Finance, DSCR, Repayment, Security, Risk).
          </p>
          <button
            onClick={onRunExtraction}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Extract 90+ Parameters Now</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      {fields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Total Dictionary Fields
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-slate-900">{fields.length}</span>
              <span className="text-slate-500 text-xs font-medium mb-1">17 sections</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Bank canonical credit model</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Available Facts
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-emerald-600">{availableCount}</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase mb-1">
                {((availableCount / fields.length) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Verified with source locators</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Missing Facts
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-slate-700">{missingCount}</span>
              <span className="text-slate-500 text-xs font-medium mb-1">
                {((missingCount / fields.length) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Marked [MISSING] in final note</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Review / Conflicts
            </div>
            <div className="flex items-end space-x-2">
              <span
                className={`text-2xl font-bold ${
                  reviewCount > 0 ? 'text-amber-600' : 'text-slate-700'
                }`}
              >
                {reviewCount}
              </span>
              {reviewCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase mb-1">
                  Requires Review
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Highlighted for credit committee</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {fields.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, label, value, evidence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-xs ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({fields.length})
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-xs ${
                  statusFilter === 'available'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Available ({availableCount})
              </button>
              <button
                onClick={() => setStatusFilter('missing')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-xs ${
                  statusFilter === 'missing'
                    ? 'bg-slate-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Missing ({missingCount})
              </button>
              <button
                onClick={() => setStatusFilter('conflict')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-xs ${
                  statusFilter === 'conflict'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Conflict ({fields.filter((f) => f.status === 'conflict').length})
              </button>
            </div>

            {/* Section Filter Dropdown */}
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All 17 Sections</option>
              {allSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing {filteredFields.length} of {fields.length} facts
          </div>
        </div>
      )}

      {/* Main Extracted Fields Table */}
      {filteredFields.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Field ID</th>
                  <th className="px-6 py-3">Section</th>
                  <th className="px-6 py-3">Label / Parameter</th>
                  <th className="px-6 py-3">Extracted Value</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Source Locator</th>
                  <th className="px-6 py-3">Verbatim Evidence</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {filteredFields.map((field) => (
                  <tr
                    key={field.field_id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => onSelectFieldDetail(field)}
                  >
                    <td className="px-6 py-3.5 font-mono font-bold text-indigo-700 text-xs">
                      {field.field_id}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {field.section}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900 max-w-[200px] truncate">
                      {field.label}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-semibold text-slate-900 max-w-[240px] truncate text-xs">
                      {field.value !== null && field.value !== undefined
                        ? String(field.value)
                        : <span className="text-slate-400 italic font-normal">null ([MISSING])</span>}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                          field.status === 'available'
                            ? 'bg-emerald-100 text-emerald-700'
                            : field.status === 'missing'
                            ? 'bg-slate-100 text-slate-600'
                            : field.status === 'conflict'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {field.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-indigo-700 truncate max-w-[160px]">
                      {field.source || '—'}
                    </td>
                    <td
                      className="px-6 py-3.5 text-slate-600 italic text-xs max-w-[260px] truncate"
                      title={field.evidence}
                    >
                      {field.evidence ? `“${field.evidence}”` : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFieldDetail(field);
                        }}
                        className="text-slate-400 group-hover:text-indigo-600 p-1 hover:bg-slate-100 rounded transition-colors"
                        title="Audit Detail & Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Extracted facts are locked and ready for mathematical and policy rule validation.
            </span>
            <button
              onClick={onNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Proceed to Evidence & Validation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
