import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  FileText,
  FileCode,
  Trash2,
  Eye,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { IngestedFile } from '../types';
import { calculateAccuratePageCount } from '../lib/pageParserEngine';

interface Step1UploadProps {
  files: IngestedFile[];
  onFilesChange: (files: IngestedFile[]) => void;
  onNext: () => void;
  isProcessing: boolean;
  useOCR: boolean;
  onToggleOCR: (enabled: boolean) => void;
}

export const Step1Upload: React.FC<Step1UploadProps> = ({
  files,
  onFilesChange,
  onNext,
  isProcessing,
  useOCR,
  onToggleOCR,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [previewFile, setPreviewFile] = useState<IngestedFile | null>(null);

  // File Upload Handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newFiles: IngestedFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const lower = file.name.toLowerCase();
      const { text, pageCount } = await parseUploadedFile(file, useOCR);
      const parserMethod = getParserMethod(file.name, useOCR);

      newFiles.push({
        name: file.name,
        type: file.type || 'text/plain',
        size: file.size,
        text: text,
        parserMethod: parserMethod,
        charCount: text.length,
        pageCount: pageCount,
        uploadedAt: new Date().toISOString(),
        rawBlob: lower.endsWith('.pdf') ? file : null,
      });
    }

    onFilesChange([...files, ...newFiles]);
    event.target.value = '';
  };

  const handleAddPastedText = () => {
    if (!pastedText.trim()) return;
    const name = pastedTitle.trim() || `Manual_Pasted_Doc_${files.length + 1}.txt`;
    const pageCount = calculateAccuratePageCount({ name, text: pastedText });
    const newFile: IngestedFile = {
      name,
      type: 'text/plain',
      size: new Blob([pastedText]).size,
      text: pastedText,
      parserMethod: 'Text / Markdown parser',
      charCount: pastedText.length,
      pageCount: pageCount,
      uploadedAt: new Date().toISOString(),
    };
    onFilesChange([...files, newFile]);
    setPastedTitle('');
    setPastedText('');
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const totalChars = files.reduce((acc, f) => acc + f.charCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              STAGE 1: SOURCE INTAKE
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Project Dossier & Document Intake
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Upload loan applications, executed PPAs, LOAs, Chartered Accountant cost certificates, DPR, PVSyst simulation reports, CEIG approvals, and other project documents.
          </p>
        </div>

        {/* OCR Toggle & Quick Stats */}
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={useOCR}
              onChange={(e) => onToggleOCR(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>OCR Scanned PDFs & Certificates</span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'upload'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" /> Upload Files (.pdf, .docx, .json, .txt)
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'paste'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" /> Paste Text / Key Clauses
        </button>
      </div>

      {/* Tab: Upload Files */}
      {activeTab === 'upload' && (
        <div className="bg-white p-8 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors text-center shadow-xs">
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.docx,.json,.txt,.md,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">
              Click to select or drag and drop files
            </span>
            <span className="text-xs text-slate-500 mt-1 max-w-md">
              Supports PPA (.pdf), Tender LOA (.docx), CA Certificates (.pdf), Technical Specs, and Financial Models (.json).
            </span>
            <span className="mt-4 bg-white text-slate-700 text-xs font-semibold px-4 py-2 rounded-md border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors">
              Browse Local Files
            </span>
          </label>
        </div>
      )}

      {/* Tab: Paste Text */}
      {activeTab === 'paste' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Document Title / Citation
            </label>
            <input
              type="text"
              placeholder="e.g. Executed_PPA_Clause_Extract.txt"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Source Text (include [PDF page 1] or [Clause 4.1] tags)
            </label>
            <textarea
              rows={6}
              placeholder="Paste raw agreement clauses, loan sanction notes, or technical specifications..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={handleAddPastedText}
            disabled={!pastedText.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add to Intake Portfolio
          </button>
        </div>
      )}

      {/* Ingested Files Table */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Ingested Documents ({files.length})
              </h3>
              <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {totalChars.toLocaleString()} characters
              </span>
            </div>
            <button
              onClick={() => onFilesChange([])}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Document Name</th>
                  <th className="px-6 py-3">Parser Method</th>
                  <th className="px-6 py-3">Size / Chars</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {files.map((file, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate max-w-xs md:max-w-md">{file.name}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {file.parserMethod}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
                      {file.charCount.toLocaleString()} chars
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        <CheckCircle className="w-3 h-3" /> Ready
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer transition-colors"
                        title="View Extracted Text"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
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
              All documents ready for Gemini document intelligence & gap analysis.
            </span>
            <button
              onClick={onNext}
              disabled={files.length === 0 || isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Proceed to Document Intelligence</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{previewFile.name}</h4>
                <p className="text-xs text-slate-500">
                  {previewFile.parserMethod} — {previewFile.charCount} characters
                </p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-100 whitespace-pre-wrap bg-slate-900">
              {previewFile.text}
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-right">
              <button
                onClick={() => setPreviewFile(null)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-md shadow-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

async function parseUploadedFile(file: File, useOCR: boolean): Promise<{ text: string; pageCount: number }> {
  const lower = file.name.toLowerCase();

  // DOCX files: parse via JSZip
  if (lower.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXml = await zip.file('word/document.xml')?.async('text');
      if (docXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXml, 'text/xml');
        const paragraphs = xmlDoc.getElementsByTagName('w:p');
        const lines: string[] = [];
        for (let j = 0; j < paragraphs.length; j++) {
          const texts = paragraphs[j].getElementsByTagName('w:t');
          let pText = '';
          for (let k = 0; k < texts.length; k++) {
            pText += texts[k].textContent || '';
          }
          if (pText.trim()) lines.push(pText.trim());
        }
        const fullText = lines.join('\n\n');
        const pageCount = calculateAccuratePageCount({ name: file.name, text: fullText });
        return { text: fullText, pageCount };
      }
    } catch (e) {
      console.warn('DOCX ZIP parsing failed, reading as text fallback:', e);
    }
  }

  // PDF files: fast local inspection only — exact page count via pypdfium2.
  // Actual LlamaParse calls happen per page in Stage 2 (Page Parse Monitor).
  if (lower.endsWith('.pdf')) {
    try {
      const inspected = await inspectPdfViaBackend(file);
      if (inspected) return inspected;
    } catch (e) {
      console.warn('PDF inspection unavailable, falling back to raw scan:', e);
    }
    try {
      const text = await readFileAsText(file);
      const detectedPages = await detectPdfPageCount(file, text);
      return { text, pageCount: Math.max(1, detectedPages) };
    } catch (e) {
      console.warn('PDF parsing error:', e);
    }
  }

  // DOCX files: prefer the Python structural parser
  if (lower.endsWith('.docx')) {
    try {
      const parsed = await parseDocxViaBackend(file);
      if (parsed) return { text: parsed.text, pageCount: parsed.pageCount || 1 };
    } catch (e) {
      console.warn('Python DOCX parsing unavailable, falling back to JSZip:', e);
    }
  }

  // JSON or text files
  const rawText = await readFileAsText(file);
  const pageCount = calculateAccuratePageCount({ name: file.name, text: rawText });
  return { text: rawText, pageCount };
}

// Inspect a PDF via the Python backend: exact page count, zero LlamaParse
// credits. Per-page parsing happens later in the Page Parse Monitor.
async function inspectPdfViaBackend(file: File): Promise<IngestedFile | null> {
  const res = await fetch('/api/pdf/inspect', {
    method: 'POST',
    headers: {
      'content-type': 'application/pdf',
      'x-file-name': encodeURIComponent(file.name)
    },
    body: file
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || typeof data.pageCount !== 'number') return null;

  const scannedNote = data.allPagesDone
    ? `all ${data.pageCount} pages cached`
    : data.isMostlyScanned
      ? 'scanned — LlamaParse per page in Stage 2'
      : `LlamaParse per page in Stage 2${data.cachedPages ? `, ${data.cachedPages} cached` : ''}`;

  return {
    name: data.fileName || file.name,
    type: 'application/pdf',
    size: file.size,
    text: `[PDF attached for page-level parsing: ${data.pageCount} pages]`,
    parserMethod: `LlamaParse (agentic) — ${scannedNote}`,
    charCount: 0,
    pageCount: data.pageCount,
    uploadedAt: new Date().toISOString(),
    rawBlob: file
  };
}

// Parse a DOCX via the Python backend; falls back to JSZip on failure.
async function parseDocxViaBackend(file: File): Promise<IngestedFile | null> {
  const res = await fetch('/api/docx/parse', {
    method: 'POST',
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'x-file-name': encodeURIComponent(file.name)
    },
    body: file
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !data.text) return null;
  const text = data.text as string;
  const pageCount = calculateAccuratePageCount({ name: file.name, text });
  return {
    name: data.fileName || file.name,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: file.size,
    text,
    parserMethod: 'Python DOCX structural parser',
    charCount: text.length,
    pageCount,
    uploadedAt: new Date().toISOString()
  };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve((e.target?.result as string) || '');
    };
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

// Detect PDF page count from raw bytes. Scanned PDFs store page objects in
// compressed object streams, so a plain "/Type /Page" scan on decoded text
// misses them. Decode as latin1 (byte-preserving) and combine multiple signals:
// the page tree "/Count N" entries, "/Type /Page" object occurrences, and an
// image-density heuristic for pure scans.
async function detectPdfPageCount(file: File, text: string): Promise<number> {
  const candidates: number[] = [];

  try {
    const raw = await readFileAsLatin1(file);

    // Page tree counts: root node's Count equals total page count
    const countMatches = Array.from(raw.matchAll(/\/Count\s+(\d+)/g));
    for (const m of countMatches) {
      const v = parseInt(m[1], 10);
      if (v > 0 && v < 100000) candidates.push(v);
    }

    // Uncompressed page objects
    const typePageMatches = raw.match(/\/Type\s*\/Page[^s]/g);
    if (typePageMatches) candidates.push(typePageMatches.length);

    // Compressed object streams: count decompressed stream blocks containing
    // page dictionaries is not possible without full parsing; instead fall
    // back to counting "/Kids" arrays length hints via "N 0 R" inside Kids
    const kidsMatch = raw.match(/\/Kids\s*\[([^\]]*)\]/);
    if (kidsMatch) {
      const kidCount = (kidsMatch[1].match(/\d+\s+\d+\s+R/g) || []).length;
      if (kidCount > 0) candidates.push(kidCount);
    }
  } catch {
    // ignore — fall through to text-based heuristics
  }

  const structural = candidates.length > 0 ? Math.max(...candidates) : 0;
  if (structural > 0) return structural;

  // Scanned-PDF heuristic: almost no extractable text but a large binary body.
  // Typical scanned pages are 50–300 KB of JPEG/JPX data each.
  const printable = text.replace(/[^\x20-\x7E\n\r\t]/g, '');
  const textDensity = printable.length / Math.max(1, file.size);
  if (textDensity < 0.05 && file.size > 100 * 1024) {
    return Math.max(1, Math.round(file.size / (150 * 1024)));
  }

  return calculateAccuratePageCount({ name: file.name, text });
}

function readFileAsLatin1(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve((e.target?.result as string) || '');
    };
    reader.onerror = () => resolve('');
    reader.readAsText(file, 'latin1');
  });
}

function getParserMethod(fileName: string, useOCR: boolean): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.docx')) return 'DOCX parser';
  if (lower.endsWith('.pdf')) return useOCR ? 'PDF parser + OCR fallback' : 'PDF parser';
  if (lower.endsWith('.json')) return 'JSON parser';
  if (lower.match(/\.(png|jpg|jpeg|webp)$/)) return 'Tesseract / Vision OCR';
  return 'Text / Markdown parser';
}
