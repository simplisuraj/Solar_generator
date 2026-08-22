import { DocumentChecklistItem } from '../types';

export const DOCUMENT_CHECKLIST: DocumentChecklistItem[] = [
  {
    "Group": "Corporate",
    "Document": "Certificate of Incorporation",
    "Priority": "Mandatory",
    "Main outputs": "Name/CIN/incorporation"
  },
  {
    "Group": "Corporate",
    "Document": "MCA master data/latest filings",
    "Priority": "Mandatory",
    "Main outputs": "Directors/capital/address"
  },
  {
    "Group": "Corporate",
    "Document": "MOA/AOA",
    "Priority": "Mandatory",
    "Main outputs": "Objects/governance"
  },
  {
    "Group": "Corporate",
    "Document": "PAN/GST/Udyam/LEI",
    "Priority": "As applicable",
    "Main outputs": "Identifiers"
  },
  {
    "Group": "Ownership",
    "Document": "Latest shareholding",
    "Priority": "Mandatory",
    "Main outputs": "Shareholders/percentages"
  },
  {
    "Group": "Management",
    "Document": "Director/promoter KYC and profiles",
    "Priority": "Mandatory",
    "Main outputs": "DIN/experience/beneficial owners"
  },
  {
    "Group": "Sponsor",
    "Document": "Audited financial statements",
    "Priority": "Mandatory",
    "Main outputs": "Historical financials"
  },
  {
    "Group": "Sponsor",
    "Document": "Latest rating report",
    "Priority": "Mandatory",
    "Main outputs": "Rating/outlook/rationale"
  },
  {
    "Group": "Sponsor",
    "Document": "Equity commitment approval",
    "Priority": "If group-backed",
    "Main outputs": "Commitment/cash accrual"
  },
  {
    "Group": "Project",
    "Document": "LOA/RFS/tender",
    "Priority": "Mandatory",
    "Main outputs": "Capacity/tariff/CUF/COD/CFA"
  },
  {
    "Group": "Project",
    "Document": "JV/consortium agreement",
    "Priority": "If applicable",
    "Main outputs": "Parties/responsibilities"
  },
  {
    "Group": "Project",
    "Document": "Executed PPA + amendments",
    "Priority": "Mandatory",
    "Main outputs": "Tariff/tenure/payment/COD/security"
  },
  {
    "Group": "Land",
    "Document": "Registered lease agreement",
    "Priority": "Mandatory",
    "Main outputs": "Area/khasra/tenure/rent"
  },
  {
    "Group": "Land",
    "Document": "Revenue records/Jamabandi/Khasra",
    "Priority": "Mandatory",
    "Main outputs": "Land identity/leasehold"
  },
  {
    "Group": "Technical",
    "Document": "DPR",
    "Priority": "Mandatory",
    "Main outputs": "Project/technical assumptions"
  },
  {
    "Group": "Technical",
    "Document": "PVSyst",
    "Priority": "Mandatory",
    "Main outputs": "P90/P50/generation/degradation"
  },
  {
    "Group": "Technical",
    "Document": "SLD/technical drawings",
    "Priority": "Mandatory",
    "Main outputs": "Electrical configuration"
  },
  {
    "Group": "Technical",
    "Document": "Module/inverter/transformer datasheets",
    "Priority": "Mandatory",
    "Main outputs": "Equipment"
  },
  {
    "Group": "Technical",
    "Document": "Grid connectivity/evacuation approvals",
    "Priority": "Mandatory",
    "Main outputs": "GSS/feeder/voltage"
  },
  {
    "Group": "Commissioning",
    "Document": "Commissioning/synchronization/COD certificates",
    "Priority": "Mandatory if commissioned",
    "Main outputs": "Dates/capacity"
  },
  {
    "Group": "Commissioning",
    "Document": "CEIG/Electrical Inspector approval",
    "Priority": "As applicable",
    "Main outputs": "Energisation"
  },
  {
    "Group": "EPC",
    "Document": "EPC agreement/MOU",
    "Priority": "Mandatory",
    "Main outputs": "Scope/value/warranty/LD"
  },
  {
    "Group": "EPC",
    "Document": "EPC invoices",
    "Priority": "Mandatory for reimbursement",
    "Main outputs": "Actual CAPEX"
  },
  {
    "Group": "EPC",
    "Document": "Payment proofs/creditor ledger",
    "Priority": "If reimbursement",
    "Main outputs": "Outstanding creditor"
  },
  {
    "Group": "O&M",
    "Document": "O&M agreement",
    "Priority": "Mandatory",
    "Main outputs": "Tenure/charges/CUF"
  },
  {
    "Group": "Financial",
    "Document": "CA project cost certificate",
    "Priority": "Mandatory",
    "Main outputs": "Actual cost"
  },
  {
    "Group": "Financial",
    "Document": "CA source & utilisation certificate",
    "Priority": "Mandatory for reimbursement",
    "Main outputs": "Funds"
  },
  {
    "Group": "Financial",
    "Document": "Financial model/CMA projections",
    "Priority": "Mandatory",
    "Main outputs": "P&L/BS/CF/DSCR"
  },
  {
    "Group": "Financial",
    "Document": "Historical SPV financials",
    "Priority": "If operating",
    "Main outputs": "Actual financials"
  },
  {
    "Group": "Banking",
    "Document": "Existing sanction letters",
    "Priority": "If existing debt",
    "Main outputs": "Sanction terms"
  },
  {
    "Group": "Banking",
    "Document": "Loan statements",
    "Priority": "If existing debt",
    "Main outputs": "Outstanding/conduct"
  },
  {
    "Group": "Banking",
    "Document": "Project/escrow bank statements",
    "Priority": "Mandatory if commissioned",
    "Main outputs": "Billing/receipts"
  },
  {
    "Group": "Verification",
    "Document": "LIE report",
    "Priority": "As required",
    "Main outputs": "Technical/cost vetting"
  },
  {
    "Group": "Verification",
    "Document": "TEV report",
    "Priority": "As required",
    "Main outputs": "Viability/cost"
  },
  {
    "Group": "Operations",
    "Document": "Generation/SCADA reports",
    "Priority": "If commissioned",
    "Main outputs": "Actual generation"
  },
  {
    "Group": "Operations",
    "Document": "DISCOM bills",
    "Priority": "If commissioned",
    "Main outputs": "Actual billing"
  },
  {
    "Group": "Insurance",
    "Document": "Plant insurance",
    "Priority": "Mandatory",
    "Main outputs": "Coverage/validity"
  },
  {
    "Group": "Regulatory",
    "Document": "CFA/MNRE documents",
    "Priority": "If applicable",
    "Main outputs": "CFA"
  },
  {
    "Group": "Legal",
    "Document": "Law officer opinions",
    "Priority": "As required",
    "Main outputs": "PPA/lease/EPC/TPA"
  },
  {
    "Group": "Due Diligence",
    "Document": "ROC/CERSAI/CRILC/CIBIL etc.",
    "Priority": "Bank-side",
    "Main outputs": "Verification status"
  }
];
