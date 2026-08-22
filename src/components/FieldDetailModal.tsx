import React, { useState } from 'react';
import { ExtractedField } from '../types';
import { CheckCircle2, AlertCircle, Save, X, BookOpen, ShieldCheck, MapPin, Quote } from 'lucide-react';

interface FieldDetailModalProps {
  field: ExtractedField | null;
  onClose: () => void;
  onSave: (fieldId: string, updated: Partial<ExtractedField>) => void;
}

export const FieldDetailModal: React.FC<FieldDetailModalProps> = ({
  field,
  onClose,
  onSave,
}) => {
  if (!field) return null;

  const [editValue, setEditValue] = useState(field.value !== null ? String(field.value) : '');
  const [editStatus, setEditStatus] = useState(field.status);
  const [editEvidence, setEditEvidence] = useState(field.evidence || '');

  const handleSave = () => {
    onSave(field.field_id, {
      value: editValue.trim() === '' ? null : editValue,
      status: editStatus,
      evidence: editEvidence,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full flex flex-col shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-600 text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
              {field.field_id}
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">{field.label}</h3>
              <p className="text-xs text-slate-500">{field.section}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 font-bold text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider block text-[10px]">
                Primary Document Source
              </span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block">
                {field.source || '[Unassigned]'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider block text-[10px]">
                Extraction Confidence
              </span>
              <span className="font-bold text-emerald-600 mt-0.5 block">
                {field.confidence ? `${(field.confidence * 100).toFixed(0)}%` : 'Manual'}
              </span>
            </div>
          </div>

          {/* Value Edit */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Field Value
            </label>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Leave empty for null ([MISSING])"
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Extraction Status
            </label>
            <div className="flex gap-2">
              {(['available', 'missing', 'review', 'conflict'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEditStatus(st)}
                  className={`px-3 py-1.5 rounded-md font-bold uppercase text-[10px] tracking-wider cursor-pointer border transition-colors ${
                    editStatus === st
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Snippet */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Verbatim Source Evidence (Citation Snippet)
            </label>
            <textarea
              rows={3}
              value={editEvidence}
              onChange={(e) => setEditEvidence(e.target.value)}
              placeholder="Verbatim text from source document confirming this fact..."
              className="w-full text-xs italic p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Changes immediately update validation rules and proposal mail merge.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-md cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
