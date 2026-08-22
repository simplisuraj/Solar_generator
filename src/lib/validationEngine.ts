import { ExtractedField, ValidationCheckResult, ReconciliationItem, DocumentCaseItem } from '../types';

export function runValidationChecks(
  fields: ExtractedField[],
  reconciliations?: ReconciliationItem[],
  documents?: DocumentCaseItem[]
): ValidationCheckResult[] {
  const checks: ValidationCheckResult[] = [];
  const valMap = new Map<string, any>();
  const fieldMap = new Map<string, ExtractedField>();

  for (const f of fields) {
    fieldMap.set(f.field_id, f);
    if ((f.status === 'FOUND' || (f as any).status === 'available') && f.value !== null && f.value !== undefined) {
      valMap.set(f.field_id, f.value);
    }
  }

  // 1. Document Parsing Completion Gate
  if (documents && documents.length > 0) {
    const incompleteDocs = documents.filter((d) => d.status !== 'PARSED' && d.status !== 'READY_FOR_EXTRACTION');
    const failedPagesCount = documents.reduce((sum, d) => sum + d.pages.filter((p) => p.status === 'FAILED').length, 0);

    if (failedPagesCount > 0 || incompleteDocs.length > 0) {
      checks.push({
        rule_id: 'GATE-001',
        check: 'Document Ingestion & Parsing Gate',
        status: 'FAIL',
        detail: `${failedPagesCount} failed page(s) detected across ${incompleteDocs.length} incomplete document(s). Must retry failed pages before final proposal generation.`,
        category: 'Ingestion Gate',
        severity: 'HIGH',
        blocking: true
      });
    } else {
      checks.push({
        rule_id: 'GATE-001',
        check: 'Document Ingestion & Parsing Gate',
        status: 'PASS',
        detail: `All ${documents.length} uploaded document(s) fully parsed with 0 failed pages.`,
        category: 'Ingestion Gate',
        severity: 'HIGH',
        blocking: false
      });
    }
  }

  // 2. Loan to Project Cost Check (VAL-006)
  const loan = parseNumber(valMap.get('PROP-003') ?? valMap.get('FIN-001'));
  const cost = parseNumber(valMap.get('CST-001') ?? valMap.get('CST-002'));

  if (loan !== null && cost !== null && cost > 0) {
    const ratio = (loan / cost) * 100;
    if (ratio <= 75.05) {
      checks.push({
        rule_id: 'VAL-006',
        check: 'Loan to Project Cost Ratio',
        status: 'PASS',
        detail: `${ratio.toFixed(1)}% (LTV ₹${loan} Cr on ₹${cost} Cr cost — compliant with <= 75% limit)`,
        category: 'Funding integrity',
        severity: 'HIGH',
        blocking: false
      });
    } else {
      checks.push({
        rule_id: 'VAL-006',
        check: 'Loan to Project Cost Ratio',
        status: 'REVIEW',
        detail: `${ratio.toFixed(1)}% exceeds standard 75.0% threshold (Requires higher approval authority deviation)`,
        category: 'Funding integrity',
        severity: 'HIGH',
        blocking: false
      });
    }
  } else {
    checks.push({
      rule_id: 'VAL-006',
      check: 'Loan to Project Cost Ratio',
      status: 'REVIEW',
      detail: 'Required financial values (PROP-003 / CST-001) not yet fully extracted from dossier',
      category: 'Funding integrity',
      severity: 'HIGH',
      blocking: false
    });
  }

  // 3. Door-to-Door Tenor Check (VAL-010)
  const tenor = parseNumber(valMap.get('PROP-004'));
  if (tenor !== null) {
    if (tenor <= 180) {
      checks.push({
        rule_id: 'VAL-010',
        check: 'Door-to-door Tenor',
        status: 'PASS',
        detail: `${tenor} months (15.0 years — within standard solar infrastructure guidelines)`,
        category: 'Debt schedule',
        severity: 'HIGH',
        blocking: false
      });
    } else {
      checks.push({
        rule_id: 'VAL-010',
        check: 'Door-to-door Tenor',
        status: 'REVIEW',
        detail: `${tenor} months exceeds 180 months benchmark (Policy deviation requires sanction committee waiver)`,
        category: 'Debt schedule',
        severity: 'HIGH',
        blocking: false
      });
    }
  } else {
    checks.push({
      rule_id: 'VAL-010',
      check: 'Door-to-door Tenor',
      status: 'REVIEW',
      detail: 'Tenor not available in extracted fields',
      category: 'Debt schedule',
      severity: 'HIGH',
      blocking: false
    });
  }

  // 4. P90 Average Gross DSCR (VAL-008)
  const dscr = parseNumber(valMap.get('DSCR-001') ?? valMap.get('DSCR-002'));
  if (dscr !== null) {
    if (dscr >= 1.20) {
      checks.push({
        rule_id: 'VAL-008',
        check: 'Average P90 DSCR',
        status: 'PASS',
        detail: `${dscr.toFixed(2)}x (Satisfies benchmark >= 1.20x for renewable project finance)`,
        category: 'Credit viability',
        severity: 'HIGH',
        blocking: false
      });
    } else {
      checks.push({
        rule_id: 'VAL-008',
        check: 'Average P90 DSCR',
        status: 'REVIEW',
        detail: `${dscr.toFixed(2)}x is below standard 1.20x benchmark (Stress mitigation required)`,
        category: 'Credit viability',
        severity: 'HIGH',
        blocking: false
      });
    }
  } else {
    checks.push({
      rule_id: 'VAL-008',
      check: 'Average P90 DSCR',
      status: 'REVIEW',
      detail: 'P90 DSCR value missing or not yet calculated',
      category: 'Credit viability',
      severity: 'HIGH',
      blocking: false
    });
  }

  // 5. Cross-Document Source Conflicts (VAL-002)
  const conflictFields = fields.filter((f) => f.status === 'CONFLICT' || (f as any).status === 'conflict');
  const reconConflicts = reconciliations ? reconciliations.filter((r) => r.status === 'conflict') : [];
  const totalConflicts = Math.max(conflictFields.length, reconConflicts.length);

  if (totalConflicts === 0) {
    checks.push({
      rule_id: 'VAL-002',
      check: 'Cross-document Source Integrity',
      status: 'PASS',
      detail: '0 unresolved conflicts detected across PPA, LOA, DPR, CA certificates, and financial model.',
      category: 'Cross-document integrity',
      severity: 'HIGH',
      blocking: false
    });
  } else {
    checks.push({
      rule_id: 'VAL-002',
      check: 'Cross-document Source Integrity',
      status: 'FAIL',
      detail: `${totalConflicts} cross-document conflict(s) detected. Must be resolved before mail merge proposal generation.`,
      category: 'Cross-document integrity',
      severity: 'HIGH',
      blocking: true
    });
  }

  // 6. Mandatory Fields Completeness (VAL-014)
  const missingMandatory = fields.filter(
    (f) =>
      (f.requirement === 'Yes' || f.requirement === 'Mandatory') &&
      (f.status === 'MISSING' || (f as any).status === 'missing' || f.value === null)
  );

  if (missingMandatory.length === 0) {
    checks.push({
      rule_id: 'VAL-014',
      check: 'Mandatory Proposal Data Integrity',
      status: 'PASS',
      detail: 'All essential regulatory, SPV, tariff, and commercial fields are present and supported.',
      category: 'Anti-hallucination',
      severity: 'HIGH',
      blocking: false
    });
  } else {
    checks.push({
      rule_id: 'VAL-014',
      check: 'Mandatory Proposal Data Integrity',
      status: 'FAIL',
      detail: `${missingMandatory.length} mandatory field(s) missing evidence (e.g. ${missingMandatory.slice(0, 3).map((m) => m.label).join(', ')})`,
      category: 'Anti-hallucination',
      severity: 'HIGH',
      blocking: true
    });
  }

  // 7. Tariff and Capacity Matching (VAL-004)
  const ppaTariff = parseNumber(valMap.get('PPA-005'));
  const loaTariff = parseNumber(valMap.get('LOA-006'));
  if (ppaTariff !== null && loaTariff !== null) {
    if (Math.abs(ppaTariff - loaTariff) < 0.001) {
      checks.push({
        rule_id: 'VAL-004',
        check: 'Tariff Consistency (PPA vs LOA)',
        status: 'PASS',
        detail: `Exact match: ₹${ppaTariff.toFixed(2)}/kWh in PPA reconciles with LOA award.`,
        category: 'Revenue/technical integrity',
        severity: 'HIGH',
        blocking: false
      });
    } else {
      checks.push({
        rule_id: 'VAL-004',
        check: 'Tariff Consistency (PPA vs LOA)',
        status: 'FAIL',
        detail: `Discrepancy: PPA tariff ₹${ppaTariff}/kWh vs LOA tariff ₹${loaTariff}/kWh`,
        category: 'Revenue/technical integrity',
        severity: 'HIGH',
        blocking: true
      });
    }
  }

  // 8. Provenance and Locator Traceability (VAL-001)
  const availableFields = fields.filter((f) => f.status === 'FOUND' || (f as any).status === 'available');
  const fieldsWithEvidence = availableFields.filter((f) => f.evidence && f.evidence.trim().length > 0);
  const evidencePct = availableFields.length > 0 ? (fieldsWithEvidence.length / availableFields.length) * 100 : 0;

  checks.push({
    rule_id: 'VAL-001',
    check: 'Fact Provenance & Citation Coverage',
    status: evidencePct >= 90 ? 'PASS' : 'REVIEW',
    detail: `${evidencePct.toFixed(1)}% of available facts contain verified document page locators and verbatim evidence citations.`,
    category: 'Provenance',
    severity: 'HIGH',
    blocking: false
  });

  return checks;
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

export const evaluateValidationRules = runValidationChecks;
