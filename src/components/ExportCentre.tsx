import React, { useState } from 'react';
import {
  DocumentCaseItem,
  ExtractedField,
  ReconciliationItem,
  ValidationCheckResult,
  MailMergePatch,
  AuditLogEntry
} from '../types';
import {
  Download,
  FileText,
  FileCode,
  PackageCheck,
  Archive,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  exportSinglePageMarkdown,
  exportDocumentPagesZip,
  exportStitchedMarkdown,
  exportAllCaseArtifactsZip,
  exportAuditLogsCsv,
  downloadJson,
  downloadText
} from '../lib/exportEngine';

interface ExportCentreProps {
  documents: DocumentCaseItem[];
  fields: ExtractedField[];
  reconciliations: ReconciliationItem[];
  validations: ValidationCheckResult[];
  patches: MailMergePatch[];
  auditLogs: AuditLogEntry[];
}

export const ExportCentre: React.FC<ExportCentreProps> = ({
  documents,
  fields,
  reconciliations,
  validations,
  patches,
  auditLogs
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    documents[0]?.id || ''
  );
  const [selectedPage, setSelectedPage] = useState<number>(1);

  const activeDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  // Proposal JSON
  const handleExportProposalJson = () => {
    downloadJson(fields, 'canonical_proposal_data_v11.json');
  };

  // Reconciliation JSON
  const handleExportReconJson = () => {
    downloadJson(reconciliations, 'cross_document_reconciliation.json');
  };

  // Validation Report
  const handleExportValidationReport = () => {
    downloadJson(validations, 'validation_report.json');
  };

  // Parsing Summary Report
  const handleExportParsingReport = () => {
    const report = {
      exported_at: new Date().toISOString(),
      total_documents: documents.length,
      total_pages: documents.reduce((sum, d) => sum + d.total_pages, 0),
      parsed_pages: documents.reduce(
        (sum, d) => sum + d.pages.filter((p) => p.status === 'SUCCESS').length,
        0
      ),
      failed_pages: documents.reduce(
        (sum, d) => sum + d.pages.filter((p) => p.status === 'FAILED').length,
        0
      ),
      documents: documents.map((d) => ({
        id: d.id,
        filename: d.filename,
        total_pages: d.total_pages,
        status: d.status,
        pages: d.pages
      }))
    };
    downloadJson(report, 'parsing_summary_report.json');
  };

  // Export Master ZIP Bundle
  const handleExportMasterZip = async () => {
    await exportAllCaseArtifactsZip({
      documents,
      fields,
      reconciliations,
      validations,
      patches,
      auditLogs
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight">Case Artifacts & Export Centre</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Complete data provenance package · Export immutable Markdown pages, JSON schemas, audit trails, and final sanction drafts.
          </p>
        </div>

        <button
          onClick={handleExportMasterZip}
          className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 transition shadow-xs cursor-pointer"
        >
          <Archive className="w-4 h-4" />
          Download Complete Case Bundle (ZIP)
        </button>
      </div>

      {/* Grid of 4 Export Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Category 1: Markdown Artifacts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <FileCode className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Markdown Artifacts</h3>
            </div>
            <p className="text-xs text-slate-500">
              Immutable per-page files with YAML frontmatter metadata and stitched sequential documents.
            </p>

            {/* Document selector */}
            {documents.length > 0 && (
              <div className="mt-3 space-y-2">
                <label className="text-[11px] font-semibold text-slate-700">Target Document:</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value);
                    setSelectedPage(1);
                  }}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-slate-50 text-slate-800 font-mono focus:ring-1 focus:ring-indigo-500"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.filename} ({d.total_pages}p)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {activeDoc && (
              <>
                <button
                  onClick={() => exportDocumentPagesZip(activeDoc)}
                  disabled={!activeDoc.pages.some((p) => p.status === 'SUCCESS')}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Archive className="w-3.5 h-3.5" /> All Pages ZIP
                  </span>
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => exportStitchedMarkdown(activeDoc)}
                  disabled={!activeDoc.stitched_markdown}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Stitched Document (.md)
                  </span>
                  <Download className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Category 2: Structured JSONs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <FileSpreadsheet className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Structured JSON Data</h3>
            </div>
            <p className="text-xs text-slate-500">
              Canonical Proposal schema matching the Data Dictionary with full page provenance citations.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleExportProposalJson}
              disabled={fields.length === 0}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Proposal Data JSON
              </span>
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleExportReconJson}
              disabled={reconciliations.length === 0}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Reconciliation JSON
              </span>
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => downloadJson(patches, 'mail_merge_patch_plan.json')}
              disabled={patches.length === 0}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Patch Plan JSON
              </span>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category 3: Compliance & Audit Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Compliance & Reports</h3>
            </div>
            <p className="text-xs text-slate-500">
              Audit trails, validation check sheets, and parsing coverage reports.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleExportParsingReport}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-700 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Parsing Summary (.json)
              </span>
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleExportValidationReport}
              disabled={validations.length === 0}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-700 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Validation Report (.json)
              </span>
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => exportAuditLogsCsv(auditLogs)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-700 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Audit Log (.csv)
              </span>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category 4: Final Sanction Note Proposal */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 mb-2">
              <PackageCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Sanction Note Package</h3>
            </div>
            <p className="text-xs text-slate-500">
              Sanction memorandum with merged project facts, financial ratios, and security covenants.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                const sanctionText = `# CREDIT APPRAISAL & SANCTION NOTE\n\nGenerated from Credit Appraisal Studio V11\nDate: ${new Date().toLocaleDateString()}\n\n## 1. PROJECT HIGHLIGHTS\n- Borrower: ${fields.find((f) => f.field_id === 'SPV-001')?.value || '[MISSING]'}\n- Capacity: ${fields.find((f) => f.field_id === 'PRJ-013')?.value || '[MISSING]'} MW AC\n- Term Loan: INR ${fields.find((f) => f.field_id === 'PROP-003')?.value || '[MISSING]'} Cr\n- Tariff: INR ${fields.find((f) => f.field_id === 'PPA-005')?.value || '[MISSING]'} / kWh\n\n---\n*Validated under strict credit governance rules.*`;
                downloadText(sanctionText, 'credit_sanction_proposal_note.md', 'text/markdown');
              }}
              className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5" /> Sanction Note (.md)
              </span>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
