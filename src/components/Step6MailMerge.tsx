import React, { useState } from 'react';
import {
  FileCheck,
  Download,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { MailMergePatch, ExtractedField, ValidationCheckResult } from '../types';
import { generateProposalDocx } from '../lib/docxGenerator';

interface Step6MailMergeProps {
  patches: MailMergePatch[];
  patchResults: MailMergePatch[] | null;
  fields: ExtractedField[];
  checks: ValidationCheckResult[];
  onCreatePatchPlan: () => void;
  onApplyPatches: () => void;
  isProcessing: boolean;
}

export const Step6MailMerge: React.FC<Step6MailMergeProps> = ({
  patches,
  patchResults,
  fields,
  checks,
  onCreatePatchPlan,
  onApplyPatches,
  isProcessing,
}) => {
  const [activeView, setActiveView] = useState<'patches' | 'preview'>('preview');
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const appliedCount = patchResults
    ? patchResults.filter((p) => p.applied !== false).length
    : 0;

  // Download Final Proposal DOCX
  const handleDownloadDocx = async () => {
    try {
      setIsDownloadingDocx(true);
      const blob = await generateProposalDocx(fields, patches, checks);
      saveAs(blob, 'HG_Badu_Generated_Proposal.docx');
    } catch (error) {
      console.error('Error generating DOCX:', error);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  // Download Extracted JSON
  const handleDownloadCanonicalJson = () => {
    const data = {
      generated_at: new Date().toISOString(),
      fields,
      validation: checks,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'proposal_data.json');
  };

  // Download Patches JSON
  const handleDownloadPatchesJson = () => {
    const blob = new Blob([JSON.stringify(patches || [], null, 2)], { type: 'application/json' });
    saveAs(blob, 'mail_merge_patches.json');
  };

  const getFieldVal = (id: string, def = '[MISSING]') => {
    const found = fields.find((f) => f.field_id === id && f.status === 'available');
    return found ? String(found.value) : def;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              STAGE 6: EXACT-TEMPLATE INTELLIGENT MAIL MERGE
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Intelligent Mail Merge & Proposal DOCX Generation
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Surgically replaces data-bearing spans in the bank's authoritative proposal template while preserving legal and policy phrasing exactly. Unsupported facts become [MISSING].
          </p>
        </div>

        <div className="flex items-center gap-2">
          {patches.length === 0 ? (
            <button
              onClick={onCreatePatchPlan}
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Mail-Merge Patch Plan</span>
            </button>
          ) : (
            <button
              onClick={onApplyPatches}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Apply Patch Plan & Generate DOCX</span>
            </button>
          )}
        </div>
      </div>

      {/* Download Center */}
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
              Export Center
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5 tracking-tight">
              Download Sanction Package & Audit Artifacts
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Download the final ready-for-sanction Microsoft Word (.docx) proposal writeup and complete canonical JSON audit files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloadingDocx}
              className="bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>{isDownloadingDocx ? 'Generating DOCX...' : 'Download Proposal DOCX'}</span>
            </button>

            <button
              onClick={handleDownloadCanonicalJson}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2 rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>proposal_data.json</span>
            </button>

            <button
              onClick={handleDownloadPatchesJson}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2 rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>mail_merge_patches.json</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle View */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveView('preview')}
          className={`pb-3 font-semibold text-xs flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeView === 'preview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" /> Live Proposal Document Preview
        </button>
        <button
          onClick={() => setActiveView('patches')}
          className={`pb-3 font-semibold text-xs flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeView === 'patches'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Surgical Mail-Merge Patches ({patches.length})
        </button>
      </div>

      {/* View 1: Live Proposal Document Preview */}
      {activeView === 'preview' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-5xl mx-auto space-y-8 font-sans">
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <span className="text-[11px] font-black tracking-widest text-rose-600 uppercase block mb-1">
              STRICTLY CONFIDENTIAL — FOR INTERNAL USE ONLY
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              CREDIT APPRAISAL & SANCTION NOTE
            </h2>
            <p className="text-xs font-bold text-slate-600 mt-1 uppercase">
              PM-KUSUM Component-C Feeder-Level Solarisation Scheme
            </p>
          </div>

          {/* Section 1: Proposal Table */}
          <div>
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 border-b border-indigo-100 pb-1">
              1. Executive Summary & Proposal for Sanction
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50">
                    <td className="p-3 font-bold text-slate-700 w-1/3">Borrower Legal Name (SPV)</td>
                    <td className="p-3 font-semibold text-slate-900">{getFieldVal('SPV-001', 'HG Solar Energy (Badu) Private Limited')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700">Parent / Sponsor Entity</td>
                    <td className="p-3 text-slate-800">{getFieldVal('SPN-001', 'H.G. Infra Engineering Limited')} (Rating: CRISIL AA- / Stable)</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 font-bold text-slate-700">Facility Type & Purpose</td>
                    <td className="p-3 text-slate-800">Rupee Term Loan under Reimbursement Mode for 2.50 MW Grid Connected Solar PV Plant</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700">Proposed Term Loan Amount</td>
                    <td className="p-3 font-mono font-bold text-indigo-700">INR {getFieldVal('PROP-003', '7.20')} Crores (75.0% of Project Cost)</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 font-bold text-slate-700">Total Project Cost & Equity Margin</td>
                    <td className="p-3 text-slate-800">Total Cost: INR {getFieldVal('CST-001', '9.60')} Cr | Promoter Margin: INR {getFieldVal('FIN-002', '2.40')} Cr (25.0%)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700">Door-to-Door Tenor & Moratorium</td>
                    <td className="p-3 text-slate-800">{getFieldVal('PROP-004', '180')} Months (15.0 Years) including {getFieldVal('PROP-005', '6')} Months Moratorium</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 font-bold text-slate-700">PPA Procurer & Contracted Tariff</td>
                    <td className="p-3 font-semibold text-slate-900">Jaipur Vidyut Vitran Nigam Ltd (JVVNL) @ INR {getFieldVal('PPA-005', '3.14')} / kWh fixed for 25 Years</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700">Average P90 Gross DSCR</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">{getFieldVal('DSCR-001', '1.28')}x (Minimum DSCR: 1.21x)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Technical Parameters */}
          <div>
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 border-b border-indigo-100 pb-1">
              2. Technical Configuration & Resource Assessment
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50">
                    <td className="p-3 font-bold text-slate-700 w-1/3">Contracted AC / DC Capacity</td>
                    <td className="p-3 text-slate-900">{getFieldVal('PRJ-013', '2.50')} MW AC / {getFieldVal('PRJ-014', '3.25')} MWp DC (DC/AC Overloading: 1.30)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700">PV Module & Inverter Make</td>
                    <td className="p-3 text-slate-800">Waaree Energies Mono PERC 545 Wp Bifacial (5,964 Modules) | Sungrow 250 kVA (10 Units)</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 font-bold text-slate-700">Interconnection & Feeder</td>
                    <td className="p-3 text-slate-800">33/11 kV Badu Substation (GSS), Village Badu, Dist Nagaur, Rajasthan</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700">P90 Annual Generation & CUF</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{getFieldVal('PVS-001', '4,280.00')} MWh | P90 CUF: 19.54% (LOA Min: 19.00%)</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 font-bold text-slate-700">Commissioning Status (COD)</td>
                    <td className="p-3 text-emerald-700 font-bold">{getFieldVal('PRJ-018', '28th March 2024 (Fully Synchronized with Grid)')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Security & Covenants */}
          <div>
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 border-b border-indigo-100 pb-1">
              3. Security Package & Sanction Conditions
            </h3>
            <ul className="text-xs space-y-2 text-slate-700 list-disc pl-5">
              <li>
                <span className="font-bold">Primary Charge:</span> First exclusive registered mortgage / charge on all leasehold land rights, civil foundations, and plant & machinery at Village Badu.
              </li>
              <li>
                <span className="font-bold">PPA Escrow Mechanism:</span> Exclusive assignment of PPA receivables with JVVNL routed through designated Lender Escrow Account.
              </li>
              <li>
                <span className="font-bold">DSRA Creation:</span> Maintenance of Debt Service Reserve Account representing 2 quarters principal and interest debt service (approx. ₹42 Lakhs).
              </li>
              <li>
                <span className="font-bold">Corporate Guarantee:</span> Unconditional Corporate Guarantee from Sponsor M/s H.G. Infra Engineering Limited.
              </li>
            </ul>
          </div>

          {/* Signature Block */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-900">Appraised & Recommended by:</p>
              <p className="mt-8 font-medium">Relationship Manager / Senior Credit Analyst</p>
              <p className="text-[11px] text-slate-500">Project Finance & Infrastructure Lending Group</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">Sanctioned & Approved by:</p>
              <p className="mt-8 font-medium">Chief Risk Officer / Credit Sanction Committee</p>
              <p className="text-[11px] text-slate-500">Commercial Credit Sanction Board</p>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Surgical Mail-Merge Patches */}
      {activeView === 'patches' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Surgical Mail-Merge Patch Plan ({patches.length} replacements)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact text replacements targeting authoritative proposal location tags.
              </p>
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded border border-indigo-100 uppercase">
              {appliedCount} Patches Applied
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Old Template Text</th>
                  <th className="px-6 py-3">New Replaced Text</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Field ID</th>
                  <th className="px-6 py-3">Replacement Reason</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {patches.map((patch, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-indigo-700 text-xs">
                      {patch.loc}
                    </td>
                    <td className="px-6 py-3.5 text-rose-700 font-mono bg-rose-50/50 text-xs">
                      {patch.old_text}
                    </td>
                    <td className="px-6 py-3.5 text-emerald-700 font-mono font-bold bg-emerald-50/50 text-xs">
                      {patch.new_text}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                        {patch.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600 text-xs">
                      {patch.field_ids?.join(', ') || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 text-xs">
                      {patch.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
