import JSZip from 'jszip';
import {
  DocumentCaseItem,
  ExtractedField,
  ReconciliationItem,
  ValidationCheckResult,
  MailMergePatch,
  AuditLogEntry
} from '../types';

/**
 * Trigger direct file download in browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  downloadBlob(blob, filename);
}

export function downloadJson(data: any, filename: string) {
  const content = JSON.stringify(data, null, 2);
  downloadText(content, filename, 'application/json');
}

/**
 * Export single page Markdown
 */
export function exportSinglePageMarkdown(doc: DocumentCaseItem, pageNumber: number) {
  const md = doc.page_markdowns[pageNumber];
  if (!md) {
    throw new Error(`Page ${pageNumber} markdown is not available.`);
  }
  const filename = `${doc.id}_page_${String(pageNumber).padStart(3, '0')}.md`;
  downloadText(md, filename, 'text/markdown');
}

/**
 * Export stitched full or partial Markdown
 */
export function exportStitchedMarkdown(doc: DocumentCaseItem) {
  const md = doc.stitched_markdown || `# ${doc.filename}\n\n[Stitched content unavailable]`;
  const isComplete = doc.is_stitched_complete;
  const filename = isComplete ? `${doc.id}_FULL.md` : `${doc.id}_PARTIAL.md`;
  downloadText(md, filename, 'text/markdown');
}

/**
 * Export all page markdowns of a document as a ZIP file
 */
export async function exportDocumentPagesZip(doc: DocumentCaseItem) {
  const zip = new JSZip();
  const folder = zip.folder(`pages`);

  for (let p = 1; p <= doc.total_pages; p++) {
    const md = doc.page_markdowns[p];
    if (md) {
      folder?.file(`${String(p).padStart(3, '0')}.md`, md);
    }
  }

  // Include metadata.json & page_status.json
  const metadata = {
    document_id: doc.id,
    source_filename: doc.filename,
    total_pages: doc.total_pages,
    status: doc.status,
    uploaded_at: doc.uploaded_at,
    exported_at: new Date().toISOString()
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  zip.file('page_status.json', JSON.stringify(doc.pages, null, 2));

  if (doc.stitched_markdown) {
    zip.file('full_document.md', doc.stitched_markdown);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, `${doc.id}_pages_markdown.zip`);
}

/**
 * Export all parsed case artifacts into a single master ZIP package
 */
export async function exportAllCaseArtifactsZip(params: {
  documents: DocumentCaseItem[];
  fields: ExtractedField[];
  reconciliations: ReconciliationItem[];
  validations: ValidationCheckResult[];
  patches: MailMergePatch[];
  auditLogs: AuditLogEntry[];
}) {
  const zip = new JSZip();

  // 1. Documents Folder
  const docsFolder = zip.folder('documents');
  for (const doc of params.documents) {
    const docFolder = docsFolder?.folder(doc.id);
    const pagesFolder = docFolder?.folder('pages');

    for (let p = 1; p <= doc.total_pages; p++) {
      const md = doc.page_markdowns[p];
      if (md) {
        pagesFolder?.file(`${String(p).padStart(3, '0')}.md`, md);
      }
    }

    docFolder?.file('metadata.json', JSON.stringify({
      id: doc.id,
      filename: doc.filename,
      total_pages: doc.total_pages,
      status: doc.status,
      uploaded_at: doc.uploaded_at
    }, null, 2));

    docFolder?.file('page_status.json', JSON.stringify(doc.pages, null, 2));
    if (doc.stitched_markdown) {
      docFolder?.file('full_document.md', doc.stitched_markdown);
    }
  }

  // 2. Extractions Folder
  const extFolder = zip.folder('extraction');
  extFolder?.file('canonical_proposal_data.json', JSON.stringify(params.fields, null, 2));

  // 3. Reconciliation Folder
  const recFolder = zip.folder('reconciliation');
  recFolder?.file('cross_document_reconciliation.json', JSON.stringify(params.reconciliations, null, 2));

  // 4. Validation Folder
  const valFolder = zip.folder('validation');
  valFolder?.file('validation_report.json', JSON.stringify(params.validations, null, 2));

  // 5. Mail Merge Folder
  const mmFolder = zip.folder('mail_merge');
  mmFolder?.file('mail_merge_patch.json', JSON.stringify(params.patches, null, 2));

  // 6. Audit Log
  const auditFolder = zip.folder('audit');
  auditFolder?.file('audit_log.json', JSON.stringify(params.auditLogs, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `credit_appraisal_v11_case_bundle_${Date.now()}.zip`);
}

/**
 * Export Audit Logs as CSV
 */
export function exportAuditLogsCsv(logs: AuditLogEntry[]) {
  const headers = ['ID', 'Timestamp', 'User Action', 'Document ID', 'Page', 'Previous Status', 'New Status', 'Details'];
  const rows = logs.map((l) => [
    l.id,
    l.timestamp,
    l.user_action,
    l.document_id || '',
    l.page !== undefined ? String(l.page) : '',
    l.previous_status || '',
    l.new_status || '',
    `"${(l.details || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadText(csvContent, `audit_log_${Date.now()}.csv`, 'text/csv');
}
