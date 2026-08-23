import React from 'react';
import { AppSettings } from '../types';
import {
  Sliders,
  Zap,
  Cpu,
  AlertTriangle,
  FileCode,
  Layers,
  Database
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updated: Partial<AppSettings>) => void;
  onClearCache: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onClearCache
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600" />
          Appraisal Studio & Parser Settings (V11)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure page ingestion concurrency, OCR extraction pipeline, operating environment, and credit validation gates.
        </p>
      </div>

      {/* 1. Parser & Concurrency Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-600" />
          Document Parser & Pipeline Concurrency
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Default Page Parser:
            </label>
            <select
              value={settings.defaultParser}
              onChange={(e) =>
                onUpdateSettings({ defaultParser: e.target.value as any })
              }
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="llamaindex">LlamaIndex Native Markdown Parser</option>
              <option value="ocr_enhanced">LlamaIndex OCR-Enhanced (Scanned Documents)</option>
              <option value="pdf_native">Native PDF Structural Parser</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Parallel Page Concurrency:
            </label>
            <select
              value={settings.concurrency}
              onChange={(e) =>
                onUpdateSettings({ concurrency: parseInt(e.target.value, 10) })
              }
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium"
            >
              <option value={1}>1 Page at a time (Sequential - Highest Reliability)</option>
              <option value={2}>2 Concurrent Pages</option>
              <option value={4}>4 Concurrent Pages (Recommended)</option>
              <option value={8}>8 Concurrent Pages (Fastest)</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={settings.useOCRForScanned}
              onChange={(e) =>
                onUpdateSettings({ useOCRForScanned: e.target.checked })
              }
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="font-medium">
              Enable OCR Fallback for pages with low searchable character density (&lt; 20 chars)
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={settings.strictValidationGate}
              onChange={(e) =>
                onUpdateSettings({ strictValidationGate: e.target.checked })
              }
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="font-medium">
              Strict Credit Validation Gate (Blocks Mail Merge if any unparsed pages or critical conflicts exist)
            </span>
          </label>
        </div>
      </div>

      {/* 2. Cache Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          Persistent Case Cache
        </h3>
        <p className="text-xs text-slate-500">
          Page Markdown files and extracted JSON artifacts are locally cached to prevent unnecessary reprocessing and save API calls.
        </p>

        <div className="pt-2">
          <button
            onClick={onClearCache}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Clear Local Page Cache & Reset
          </button>
        </div>
      </div>
    </div>
  );
};
