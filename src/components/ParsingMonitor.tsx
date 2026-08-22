import React, { useState } from 'react';
import {
  DocumentCaseItem,
  PageMetadata,
  PageStatus,
  OperatingMode
} from '../types';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Eye,
  RotateCcw,
  Zap,
  Layers,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileDown,
  Terminal
} from 'lucide-react';
import {
  exportSinglePageMarkdown,
  exportDocumentPagesZip,
  exportStitchedMarkdown
} from '../lib/exportEngine';

interface ParsingMonitorProps {
  documents: DocumentCaseItem[];
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
  onParsePage: (docId: string, pageNum: number) => Promise<void>;
  onRetryFailedPages: (docId: string) => Promise<void>;
  onReprocessAllPages: (docId: string) => Promise<void>;
  onParseAllDocuments: () => Promise<void>;
  isProcessing: boolean;
  activeProcessingPage?: { docId: string; page: number } | null;
  operatingMode: OperatingMode;
  onProceedToExtraction: () => void;
}

export const ParsingMonitor: React.FC<ParsingMonitorProps> = ({
  documents,
  selectedDocId,
  onSelectDoc,
  onParsePage,
  onRetryFailedPages,
  onReprocessAllPages,
  onParseAllDocuments,
  isProcessing,
  activeProcessingPage,
  operatingMode,
  onProceedToExtraction
}) => {
  const [selectedPageDetail, setSelectedPageDetail] = useState<{
    doc: DocumentCaseItem;
    page: PageMetadata;
  } | null>(null);
  const [showReprocessConfirm, setShowReprocessConfirm] = useState<string | null>(null);
  const [pageSizeFilter, setPageSizeFilter] = useState<'all' | '50' | '100'>('all');
  const [pageChunkIndex, setPageChunkIndex] = useState<number>(0);

  const activeDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  // Global counts across all documents
  const totalPagesAll = documents.reduce((sum, d) => sum + d.total_pages, 0);
  const successPagesAll = documents.reduce(
    (sum, d) => sum + d.pages.filter((p) => p.status === 'SUCCESS').length,
    0
  );
  const failedPagesAll = documents.reduce(
    (sum, d) => sum + d.pages.filter((p) => p.status === 'FAILED').length,
    0
  );
  const processingPagesAll = documents.reduce(
    (sum, d) => sum + d.pages.filter((p) => p.status === 'PROCESSING' || p.status === 'RETRYING').length,
    0
  );
  const queuedPagesAll = totalPagesAll - (successPagesAll + failedPagesAll + processingPagesAll);
  const globalProgressPct = totalPagesAll > 0 ? Math.round((successPagesAll / totalPagesAll) * 100) : 0;

  // Active doc stats
  const activeTotal = activeDoc ? activeDoc.total_pages : 0;
  const activeSuccess = activeDoc ? activeDoc.pages.filter((p) => p.status === 'SUCCESS').length : 0;
  const activeFailed = activeDoc ? activeDoc.pages.filter((p) => p.status === 'FAILED').length : 0;
  const activeProcessing = activeDoc
    ? activeDoc.pages.filter((p) => p.status === 'PROCESSING' || p.status === 'RETRYING').length
    : 0;
  const activeQueued = activeTotal - (activeSuccess + activeFailed + activeProcessing);
  const activePct = activeTotal > 0 ? Math.round((activeSuccess / activeTotal) * 100) : 0;

  // Chunking for large documents (100–500 pages)
  const chunkSize = pageSizeFilter === '50' ? 50 : pageSizeFilter === '100' ? 100 : activeTotal || 1;
  const totalChunks = Math.ceil(activeTotal / chunkSize) || 1;
  const visiblePages = activeDoc
    ? activeDoc.pages.slice(pageChunkIndex * chunkSize, (pageChunkIndex + 1) * chunkSize)
    : [];

  const getLedClass = (status: PageStatus) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/50 border-emerald-400';
      case 'PROCESSING':
      case 'RETRYING':
        return 'bg-amber-500 text-white animate-pulse shadow-xs shadow-amber-500/50 border-amber-300 ring-2 ring-amber-400/40';
      case 'FAILED':
        return 'bg-rose-600 text-white shadow-xs shadow-rose-600/50 border-rose-400';
      case 'SKIPPED':
        return 'bg-slate-400 text-slate-900 border-slate-300';
      case 'QUEUED':
      default:
        return 'bg-slate-200 text-slate-600 hover:bg-slate-300 border-slate-300';
    }
  };

  const getStatusBadge = (status: PageStatus) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-200">🟢 SUCCESS</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold border border-amber-200 animate-pulse">🟠 PROCESSING</span>;
      case 'RETRYING':
        return <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold border border-amber-200 animate-pulse">🟠 RETRYING</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs font-semibold border border-rose-200">🔴 FAILED</span>;
      case 'QUEUED':
      default:
        return <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold border border-slate-200">⚪ QUEUED</span>;
    }
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No Documents Ingested</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Upload PDF or document packages in the Documents tab to begin page-by-page ingestion and LlamaIndex parsing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Global LED Summary & Actions */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Page-Level Ingestion & Parser Monitor
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  V11 Ingestion Engine
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              One page processed independently · Immutable Markdown artifacts cached in <code className="text-indigo-300 font-mono">case/documents/&lt;id&gt;/pages/*.md</code>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onParseAllDocuments}
              disabled={isProcessing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Processing Pages...' : 'Parse All Ingested Pages'}
            </button>

            {successPagesAll === totalPagesAll && totalPagesAll > 0 && (
              <button
                onClick={onProceedToExtraction}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                Proceed to Extraction <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-3 font-medium">
              <span className="text-slate-300">Total Dossier Pages: <strong className="text-white">{totalPagesAll}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400">🟢 Success: <strong>{successPagesAll}</strong></span>
              <span className="text-amber-400">🟠 Processing: <strong>{processingPagesAll}</strong></span>
              <span className="text-rose-400">🔴 Failed: <strong>{failedPagesAll}</strong></span>
              <span className="text-slate-400">⚪ Queued: <strong>{queuedPagesAll}</strong></span>
            </div>
            <span className="font-mono font-bold text-indigo-400">{globalProgressPct}% Parsed</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(successPagesAll / totalPagesAll) * 100 || 0}%` }}
            />
            <div
              className="bg-amber-500 h-full animate-pulse transition-all duration-300"
              style={{ width: `${(processingPagesAll / totalPagesAll) * 100 || 0}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{ width: `${(failedPagesAll / totalPagesAll) * 100 || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Documents Selector & Right LED Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Dossier Documents</span>
              <span className="text-xs text-slate-500 font-normal">{documents.length} files</span>
            </h3>

            <div className="mt-3 space-y-2">
              {documents.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                const docSuccess = doc.pages.filter((p) => p.status === 'SUCCESS').length;
                const docFailed = doc.pages.filter((p) => p.status === 'FAILED').length;
                const docPct = Math.round((docSuccess / doc.total_pages) * 100) || 0;

                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onSelectDoc(doc.id);
                      setPageChunkIndex(0);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {doc.filename}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {doc.total_pages} pages · {docSuccess} parsed
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          doc.status === 'READY_FOR_EXTRACTION' || doc.status === 'PARSED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : doc.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {doc.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${docPct}%` }}
                        />
                        {docFailed > 0 && (
                          <div
                            className="bg-rose-500 h-full"
                            style={{ width: `${(docFailed / doc.total_pages) * 100}%` }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{docPct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Document LED Grid & Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeDoc ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              {/* Document Header & Resumable Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{activeDoc.filename}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {activeDoc.total_pages} Pages
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Storage Path: <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">case/documents/{activeDoc.id}/pages/*.md</code>
                  </p>
                </div>

                {/* Resumable Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeFailed > 0 && (
                    <button
                      onClick={() => onRetryFailedPages(activeDoc.id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Only processes failed pages (economical in API calls)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry Failed Pages ({activeFailed})
                    </button>
                  )}

                  <button
                    onClick={() => setShowReprocessConfirm(activeDoc.id)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reprocess All
                  </button>

                  <button
                    onClick={() => exportDocumentPagesZip(activeDoc)}
                    disabled={activeSuccess === 0}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Markdown ZIP
                  </button>
                </div>
              </div>

              {/* LED Status Legend & View Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Success ({activeSuccess})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> Processing ({activeProcessing})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Failed ({activeFailed})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Queued ({activeQueued})
                  </span>
                </div>

                {/* Chunk selector if over 50 pages */}
                {activeTotal > 50 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Chunk:</span>
                    {Array.from({ length: totalChunks }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPageChunkIndex(i)}
                        className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer ${
                          pageChunkIndex === i
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {i * chunkSize + 1}–{Math.min((i + 1) * chunkSize, activeTotal)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* The LED Grid Matrix */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2">
                  {visiblePages.map((page) => {
                    const isProcessingThis =
                      activeProcessingPage?.docId === activeDoc.id &&
                      activeProcessingPage?.page === page.page;

                    return (
                      <button
                        key={page.page}
                        onClick={() => setSelectedPageDetail({ doc: activeDoc, page })}
                        className={`h-9 rounded-md flex flex-col items-center justify-center font-mono font-bold text-xs transition-all border cursor-pointer ${getLedClass(
                          isProcessingThis ? 'PROCESSING' : page.status
                        )}`}
                        title={`Page ${page.page} · Status: ${page.status} · Attempts: ${page.attempts}`}
                      >
                        <span>{page.page}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stitched Full Document Summary Bar */}
              <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Stitched Document: {activeDoc.is_stitched_complete ? '🟢 Complete' : '⚠️ Incomplete'}
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    {activeDoc.is_stitched_complete
                      ? 'All page markdown files stitched in sequential order with frontmatter delimiters.'
                      : `Missing pages: ${activeDoc.missing_pages?.join(', ') || 'Pending parsing'}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportStitchedMarkdown(activeDoc)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {activeDoc.is_stitched_complete ? 'Download Full Markdown' : 'Download Partial Markdown'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Page Detail Modal / Slide-over */}
      {selectedPageDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span>Page {selectedPageDetail.page.page} Metadata & Markdown Artifact</span>
                  {getStatusBadge(selectedPageDetail.page.status)}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedPageDetail.doc.filename} · {selectedPageDetail.page.markdown_file || 'pages/000.md'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPageDetail(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Metadata & Markdown Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 font-medium">Attempts</span>
                  <p className="text-sm font-bold text-slate-800">{selectedPageDetail.page.attempts}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 font-medium">Processing Time</span>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedPageDetail.page.processing_time_seconds ? `${selectedPageDetail.page.processing_time_seconds}s` : '—'}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 font-medium">Parser Engine</span>
                  <p className="text-sm font-bold text-slate-800 font-mono">{selectedPageDetail.page.parser}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 font-medium">Artifact Characters</span>
                  <p className="text-sm font-bold text-slate-800 font-mono">{selectedPageDetail.page.char_count || 0}</p>
                </div>
              </div>

              {selectedPageDetail.page.error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  <strong className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Extraction Error:
                  </strong>
                  <p className="mt-1 font-mono text-[11px] bg-rose-100/50 p-2 rounded">{selectedPageDetail.page.error}</p>
                </div>
              )}

              {/* Markdown Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-indigo-600" /> Immutable Markdown Content:
                  </span>
                  {selectedPageDetail.page.status === 'SUCCESS' && (
                    <button
                      onClick={() =>
                        exportSinglePageMarkdown(selectedPageDetail.doc, selectedPageDetail.page.page)
                      }
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Download .md
                    </button>
                  )}
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                  {selectedPageDetail.doc.page_markdowns[selectedPageDetail.page.page] ||
                    `# Page ${selectedPageDetail.page.page}\n[No persisted markdown yet]`}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedPageDetail(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={async () => {
                  const pNum = selectedPageDetail.page.page;
                  const dId = selectedPageDetail.doc.id;
                  setSelectedPageDetail(null);
                  await onParsePage(dId, pNum);
                }}
                disabled={isProcessing}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {selectedPageDetail.page.status === 'FAILED' ? 'Retry Page' : 'Reprocess Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reprocess All */}
      {showReprocessConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Reprocess All Pages?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will overwrite all existing cached Markdown files for this document and re-invoke parser calls for all {activeDoc?.total_pages} pages.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReprocessConfirm(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = showReprocessConfirm;
                  setShowReprocessConfirm(null);
                  await onReprocessAllPages(id);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                Yes, Reprocess All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
