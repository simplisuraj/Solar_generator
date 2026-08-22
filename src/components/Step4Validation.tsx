import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  PieChart as PieIcon,
  ArrowRight,
  Calculator,
  Percent,
  Calendar,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { ValidationCheckResult, ExtractedField } from '../types';
import { VALIDATION_RULES } from '../data/validationRules';

interface Step4ValidationProps {
  checks: ValidationCheckResult[];
  fields: ExtractedField[];
  onNext: () => void;
  onRefreshChecks: () => void;
  isProcessing: boolean;
}

export const Step4Validation: React.FC<Step4ValidationProps> = ({
  checks,
  fields,
  onNext,
  onRefreshChecks,
  isProcessing,
}) => {
  const passCount = checks.filter((c) => c.status === 'PASS').length;
  const reviewCount = checks.filter((c) => c.status === 'REVIEW').length;
  const failCount = checks.filter((c) => c.status === 'FAIL').length;

  // Sensitivity data for visual chart
  const sensitivityData = [
    { scenario: 'Base Case P90', dscr: 1.28, color: '#10B981' },
    { scenario: 'Tariff -5%', dscr: 1.21, color: '#3B82F6' },
    { scenario: 'O&M +10%', dscr: 1.26, color: '#3B82F6' },
    { scenario: 'Interest +200bps', dscr: 1.18, color: '#F59E0B' },
    { scenario: 'Generation -10%', dscr: 1.15, color: '#EF4444' },
  ];

  // Capex breakdown data
  const capexData = [
    { name: 'Plant & EPC', amount: 880, pct: '91.7%' },
    { name: 'Land Lease', amount: 35, pct: '3.6%' },
    { name: 'Grid Evacuation', amount: 28, pct: '2.9%' },
    { name: 'Pre-op & IDC', amount: 17, pct: '1.8%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              STAGE 4: EVIDENCE & VALIDATION
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Credit Policy Rules & Financial Integrity Engine
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Executes high-severity validation rules (VAL-001 through VAL-017), verifies DSCR thresholds (&gt;= 1.20x), LTV (&lt;= 75%), tenor (&lt;= 180 months), and tests model sensitivities.
          </p>
        </div>

        <button
          onClick={onRefreshChecks}
          disabled={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Calculator className="w-4 h-4" />
          <span>Re-compute Validation Rules</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Passed Rules
          </div>
          <div className="flex items-end space-x-2">
            <span className="text-2xl font-bold text-emerald-600">{passCount}</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase mb-1">
              Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Satisfies credit benchmarks</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Deviations / Review
          </div>
          <div className="flex items-end space-x-2">
            <span
              className={`text-2xl font-bold ${
                reviewCount > 0 ? 'text-amber-600' : 'text-slate-700'
              }`}
            >
              {reviewCount}
            </span>
            <span className="text-slate-500 text-xs font-medium mb-1">Requires note</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Sanction waiver/justification</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Policy Violations / Fails
          </div>
          <div className="flex items-end space-x-2">
            <span
              className={`text-2xl font-bold ${
                failCount > 0 ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              {failCount}
            </span>
            {failCount === 0 ? (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase mb-1">
                Zero Failures
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase mb-1">
                Blockers
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">Must be resolved prior to merge</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Base P90 DSCR
          </div>
          <div className="flex items-end space-x-2">
            <span className="text-2xl font-bold text-slate-900">1.28x</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase mb-1">
              &gt; 1.20x Min
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">15-year door-to-door loan</p>
        </div>
      </div>

      {/* Validation Checks Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            Core Credit Assessment & Rule Verification Checks ({checks.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Rule ID</th>
                <th className="px-6 py-3">Verification Check</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Evaluation Detail</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600">
              {checks.map((c, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-bold text-indigo-700 text-xs">
                    {c.rule_id || `VAL-${idx + 1}`}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-900">
                    {c.check}
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-xs">
                    {c.category || 'Credit Viability'}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                        c.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-700'
                          : c.status === 'FAIL'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {c.status === 'PASS' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : c.status === 'FAIL' ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-700">
                    {c.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Analytics & Sensitivity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DSCR Sensitivity Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                DSCR Sensitivity Stress Test
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates debt service buffer under adverse operational and tariff scenarios.
              </p>
            </div>
            <span className="text-[10px] bg-slate-100 font-bold px-2 py-1 rounded text-slate-700 uppercase">
              Benchmark: 1.20x
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sensitivityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <XAxis
                  dataKey="scenario"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  domain={[1.0, 1.4]}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickFormatter={(val) => `${val.toFixed(2)}x`}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(2)}x`, 'Average Gross DSCR']}
                  labelStyle={{ fontWeight: 'bold', fontSize: 12 }}
                />
                <ReferenceLine
                  y={1.2}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Policy Threshold 1.20x', fill: '#EF4444', fontSize: 10, position: 'top' }}
                />
                <Bar dataKey="dscr" radius={[4, 4, 0, 0]}>
                  {sensitivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Cost Breakdown Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Project Cost & Means of Finance
              </h4>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100 uppercase">
                Total ₹9.60 Cr
              </span>
            </div>

            <div className="space-y-2 mt-3">
              {capexData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs border border-slate-100"
                >
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900">
                      INR {item.amount.toFixed(2)} L
                    </span>
                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {item.pct}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>Proposed Bank Term Loan (75%)</span>
              <span className="text-indigo-700 font-mono">INR 7.20 Cr</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 mt-1">
              <span>Promoter Equity Margin (25%)</span>
              <span className="text-emerald-700 font-mono">INR 2.40 Cr</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={onNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Proceed to Cross-Doc Reconciliation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
