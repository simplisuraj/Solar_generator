import { ValidationRuleItem } from '../types';

export const VALIDATION_RULES: ValidationRuleItem[] = [
  {
    "Rule ID": "VAL-001",
    "Rule": "Every material fact must carry source document + page/locator + confidence",
    "Severity": "HIGH",
    "Purpose": "Provenance"
  },
  {
    "Rule ID": "VAL-002",
    "Rule": "Retain conflicting source values; never silently overwrite",
    "Severity": "HIGH",
    "Purpose": "Cross-document integrity"
  },
  {
    "Rule ID": "VAL-003",
    "Rule": "Canonical plant identity must reconcile across LOA/PPA/lease/LIE/commissioning/CA",
    "Severity": "HIGH",
    "Purpose": "Entity resolution"
  },
  {
    "Rule ID": "VAL-004",
    "Rule": "Capacity and tariff must reconcile across primary documents",
    "Severity": "HIGH",
    "Purpose": "Revenue/technical integrity"
  },
  {
    "Rule ID": "VAL-005",
    "Rule": "COD, grid connection and synchronization dates must be cross-checked",
    "Severity": "HIGH",
    "Purpose": "Timeline integrity"
  },
  {
    "Rule ID": "VAL-006",
    "Rule": "Project cost and means of finance must reconcile",
    "Severity": "HIGH",
    "Purpose": "Funding integrity"
  },
  {
    "Rule ID": "VAL-007",
    "Rule": "CA-certified CAPEX must reconcile with invoices and creditor balances for reimbursement",
    "Severity": "HIGH",
    "Purpose": "End-use verification"
  },
  {
    "Rule ID": "VAL-008",
    "Rule": "P90 generation must be used for DSCR where policy requires",
    "Severity": "HIGH",
    "Purpose": "Credit viability"
  },
  {
    "Rule ID": "VAL-009",
    "Rule": "DSCR, ICR, FACR, LTV and ratios must be independently recalculated",
    "Severity": "HIGH",
    "Purpose": "Numerical integrity"
  },
  {
    "Rule ID": "VAL-010",
    "Rule": "Repayment principal must equal proposed loan amount",
    "Severity": "HIGH",
    "Purpose": "Debt schedule"
  },
  {
    "Rule ID": "VAL-011",
    "Rule": "Lease residual tenure must satisfy policy/loan tenor requirement",
    "Severity": "HIGH",
    "Purpose": "Security eligibility"
  },
  {
    "Rule ID": "VAL-012",
    "Rule": "Actual generation/revenue must remain separate from projections",
    "Severity": "HIGH",
    "Purpose": "Performance integrity"
  },
  {
    "Rule ID": "VAL-013",
    "Rule": "Historical and projected periods must never be mixed",
    "Severity": "HIGH",
    "Purpose": "Financial integrity"
  },
  {
    "Rule ID": "VAL-014",
    "Rule": "Missing information must be explicitly MISSING; never inferred silently",
    "Severity": "HIGH",
    "Purpose": "Anti-hallucination"
  },
  {
    "Rule ID": "VAL-015",
    "Rule": "Derived values must store formula and inputs",
    "Severity": "HIGH",
    "Purpose": "Traceability"
  },
  {
    "Rule ID": "VAL-016",
    "Rule": "Policy benchmark must store circular/reference date",
    "Severity": "HIGH",
    "Purpose": "Policy traceability"
  },
  {
    "Rule ID": "VAL-017",
    "Rule": "Narrative statements must be traceable to facts or marked analyst assessment",
    "Severity": "HIGH",
    "Purpose": "Writeup integrity"
  }
];
