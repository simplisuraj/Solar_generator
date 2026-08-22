import { ExtractedField, DocumentCaseItem, ReconciliationItem, ReconciliationValueItem } from '../types';

/**
 * Scan all parsed markdown documents for multiple occurrences of key project finance metrics
 * Calls /api/gemini/reconcile when available with deterministic multi-source reconciliation fallback
 */
export async function performEvidenceReconciliation(
  fields: ExtractedField[],
  documents: DocumentCaseItem[]
): Promise<ReconciliationItem[]> {
  // First attempt Gemini API Cross-Document Reconciliation
  try {
    const response = await fetch('/api/gemini/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields,
        classified: documents.map((d) => ({
          filename: d.filename,
          document_type: d.document_type || 'Unknown'
        }))
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch (err) {
    console.warn('[ReconciliationEngine] /api/gemini/reconcile unavailable or network error, using deterministic engine:', err);
  }

  // Deterministic Multi-Document Reconciliation Engine
  const reconItems: ReconciliationItem[] = [];

  // Identify core financial & technical parameters that should cross-reconcile
  const reconcilableFields = fields.filter(
    (f) =>
      f.status === 'FOUND' ||
      f.field_id.startsWith('PROP') ||
      f.field_id.startsWith('PRJ') ||
      f.field_id.startsWith('PPA') ||
      f.field_id.startsWith('LOA') ||
      f.field_id.startsWith('CST') ||
      f.field_id.startsWith('FIN') ||
      f.field_id.startsWith('PVS') ||
      f.field_id.startsWith('DSCR')
  );

  for (const field of reconcilableFields) {
    const valuesFound: ReconciliationValueItem[] = [];

    // 1. Add the primary extracted value
    if (field.value !== null && field.value !== undefined) {
      valuesFound.push({
        value: field.value,
        source: field.source_document || 'Primary Document',
        page: field.source_page,
        evidence: field.evidence || 'Extracted verified fact'
      });
    }

    // 2. Scan other documents to find corroborating or conflicting mentions
    const fid = field.field_id;
    for (const doc of documents) {
      // Avoid searching the exact same document twice if already added
      if (doc.filename === field.source_document) continue;

      for (const page of doc.pages) {
        if (page.status !== 'SUCCESS') continue;
        const pageMd = doc.page_markdowns[page.page] || '';
        if (!pageMd) continue;

        // Check for specific cross-document parameters
        if (fid === 'PRJ-013' || fid === 'PPA-006') {
          // Capacity check
          const match = pageMd.match(/(\d+(?:\.\d+)?)\s*(?:MW\s*AC|MW\s*ac|megawatt|MW\b)/i);
          if (match && !pageMd.toLowerCase().includes('mwp')) {
            const foundVal = parseFloat(match[1]);
            const snippet = pageMd.split('\n').find((l) => l.includes(match[1])) || match[0];
            valuesFound.push({
              value: foundVal,
              source: doc.filename,
              page: page.page,
              evidence: snippet.trim()
            });
          }
        } else if (fid === 'PPA-005' || fid === 'LOA-006') {
          // Tariff check
          const match = pageMd.match(/(?:INR|Rs\.?|₹|tariff\s*(?:of|is|:)?)\s*(\d+\.\d{2,4})\s*(?:\/|\s*per)?\s*(?:kwh|unit)/i);
          if (match) {
            const foundVal = parseFloat(match[1]);
            const snippet = pageMd.split('\n').find((l) => l.includes(match[1])) || match[0];
            valuesFound.push({
              value: foundVal,
              source: doc.filename,
              page: page.page,
              evidence: snippet.trim()
            });
          }
        } else if (fid === 'CST-001') {
          // Project Cost check
          const match = pageMd.match(/(?:TOTAL\s*PROJECT\s*COST|Project\s*Cost).*?(?:INR|Rs\.?|₹)\s*(\d+(?:\.\d+)?)\s*(?:Lakhs?|Crores?|Cr\b)/i);
          if (match) {
            const raw = parseFloat(match[1]);
            const isCr = pageMd.toLowerCase().includes('crore') || pageMd.toLowerCase().includes('cr');
            const foundVal = isCr ? raw : parseFloat((raw / 100).toFixed(2));
            const snippet = pageMd.split('\n').find((l) => l.includes(match[1])) || match[0];
            valuesFound.push({
              value: foundVal,
              source: doc.filename,
              page: page.page,
              evidence: snippet.trim()
            });
          }
        }
      }
    }

    // Deduplicate identical occurrences from the same source & page
    const uniqueValues: ReconciliationValueItem[] = [];
    for (const v of valuesFound) {
      const existing = uniqueValues.find(
        (u) => u.source === v.source && u.page === v.page && String(u.value) === String(v.value)
      );
      if (!existing) {
        uniqueValues.push(v);
      }
    }

    // Determine reconciliation state strictly based on evidence
    if (uniqueValues.length === 0) {
      reconItems.push({
        field_id: field.field_id,
        label: field.label,
        status: 'insufficient_evidence',
        values: [],
        preferred_value: null,
        reason: 'No documented mentions found in any ingested document.',
        action: 'missing_evidence'
      });
    } else if (uniqueValues.length === 1) {
      reconItems.push({
        field_id: field.field_id,
        label: field.label,
        status: 'single_source',
        values: uniqueValues,
        preferred_value: uniqueValues[0].value,
        reason: `Supported by single primary document (${uniqueValues[0].source}, Page ${uniqueValues[0].page || 1}).`,
        action: 'accept'
      });
    } else {
      // Check if values agree or disagree
      const stringifiedValues = uniqueValues.map((v) => String(v.value).trim());
      const allEqual = stringifiedValues.every((val) => val === stringifiedValues[0]);

      if (allEqual) {
        reconItems.push({
          field_id: field.field_id,
          label: field.label,
          status: 'consistent',
          values: uniqueValues,
          preferred_value: uniqueValues[0].value,
          reason: `Corroborated across ${uniqueValues.length} independent sources without deviation.`,
          action: 'accept'
        });
      } else {
        reconItems.push({
          field_id: field.field_id,
          label: field.label,
          status: 'conflict',
          values: uniqueValues,
          preferred_value: uniqueValues[0].value,
          reason: `Discrepancy detected across sources: ${uniqueValues.map((u) => `${u.source} (Page ${u.page}): ${u.value}`).join(' vs ')}. Manual credit officer resolution required.`,
          action: 'manual_review'
        });
      }
    }
  }

  return reconItems;
}
