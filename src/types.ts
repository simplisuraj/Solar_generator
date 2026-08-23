export type PageStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'RETRYING' | 'SKIPPED';

export type DocumentStatus =
  | 'NOT_UPLOADED'
  | 'UPLOADED'
  | 'PARSING'
  | 'PARTIALLY_PARSED'
  | 'PARSED'
  | 'FAILED'
  | 'READY_FOR_EXTRACTION';

export type FieldStatus = 'FOUND' | 'MISSING' | 'CONFLICT' | 'CALCULATED' | 'REVIEW_REQUIRED';

export type RequirementLevel =
  | 'Yes'
  | 'If available'
  | 'If applicable'
  | 'Derived'
  | 'If reimbursement'
  | 'If required'
  | 'If commissioned'
  | 'If existing debt'
  | 'If group analysis'
  | 'Yes where applicable';

export interface DataDictionaryField {
  Section: string;
  'Field ID': string;
  'JSON Path': string;
  'Field / Label': string;
  'Data Type': string;
  Requirement: RequirementLevel;
  'Primary Source': string;
  'Validation / Rule': string;
  'Proposal Section': string;
  Notes?: string | null;
}

export interface PageMetadata {
  page: number;
  status: PageStatus;
  attempts: number;
  markdown_file: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  processing_time_seconds?: number | null;
  parser: string;
  error?: string | null;
  char_count?: number;
  has_text?: boolean;
}

export interface DocumentCaseItem {
  id: string;
  filename: string;
  display_name: string;
  file_size_bytes: number;
  file_type: string;
  total_pages: number;
  status: DocumentStatus;
  uploaded_at: string;
  raw_source_file?: Blob | null;
  document_type?: string;
  group?: string;
  priority?: string;
  confidence?: number;
  key_outputs?: string[];
  pages: PageMetadata[];
  page_markdowns: Record<number, string>;
  stitched_markdown?: string | null;
  is_stitched_complete?: boolean;
  missing_pages?: number[];
  error?: string | null;
  raw_source_text?: string;
}

export interface ExtractedField {
  field_id: string;
  field_name: string;
  label: string;
  section: string;
  json_path: string;
  requirement: string;
  primary_source: string;
  rule: string;
  value: string | number | boolean | null;
  unit?: string | null;
  status: FieldStatus;
  source_document: string;
  source_page: number | null;
  source_section: string;
  evidence: string;
  confidence: number;
  extraction_method: 'gemini_markdown' | 'deterministic_parser' | 'manual_override';
  review_required: boolean;
}

export interface DocumentChecklistItem {
  Group: string;
  Document: string;
  Priority: string;
  'Main outputs': string;
}

export interface ClassifiedDocument {
  filename: string;
  document_type: string;
  group: string;
  priority: string;
  confidence: number;
  key_outputs: string[];
  reason: string;
  source_chars?: number;
  content_sample?: string;
  file_size_bytes?: number;
  uploaded_at?: string;
}

export type ProjectStage = 'pre_construction' | 'under_construction' | 'commissioned' | 'mixed' | 'unclear';

export interface ProjectStageInfo {
  project_stage: ProjectStage;
  reimbursement_case: boolean;
  existing_debt: boolean;
  reason: string;
  confidence?: number;
}

export interface ChecklistRow {
  Group: string;
  Document: string;
  Priority: string;
  Status: 'PRESENT' | 'REQUIRED' | 'OPTIONAL / CONDITIONAL';
  'Main outputs': string;
  'Matched files': string;
  document_id?: string;
  total_pages?: number;
  parsed_pages?: number;
  failed_pages?: number;
  doc_status?: DocumentStatus;
}

export type ReconciliationStatus = 'consistent' | 'conflict' | 'single_source' | 'insufficient_evidence';
export type ReconciliationAction = 'accept' | 'manual_review' | 'missing_evidence';

export interface ReconciliationValueItem {
  value: string | number | boolean | null;
  source: string;
  page: number | null;
  evidence: string;
}

export interface ReconciliationItem {
  field_id: string;
  label: string;
  status: ReconciliationStatus;
  values: ReconciliationValueItem[];
  preferred_value: string | number | boolean | null;
  reason: string;
  action: ReconciliationAction;
  manual_override?: boolean;
}

export interface ReconciliationSummary {
  consistent: number;
  conflict: number;
  single_source: number;
  insufficient_evidence: number;
}

export interface ValidationRuleItem {
  'Rule ID': string;
  Rule: string;
  Severity: 'HIGH' | 'MEDIUM' | 'LOW';
  Purpose: string;
}

export interface ValidationCheckResult {
  check: string;
  rule_id?: string;
  status: 'PASS' | 'REVIEW' | 'FAIL';
  detail: string;
  category?: string;
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
  blocking?: boolean;
}

export interface MailMergePatch {
  loc: string;
  old_text: string;
  new_text: string;
  reason: string;
  status: 'replace' | 'missing' | 'leave';
  field_ids: string[];
  applied?: boolean;
  source_page?: number | null;
  source_doc?: string;
}

export interface TemplateBlock {
  loc: string;
  text: string;
  type?: 'paragraph' | 'table_cell' | 'heading';
}

export interface IngestedFile {
  name: string;
  type: string;
  size: number;
  text: string;
  parserMethod: string;
  charCount: number;
  uploadedAt: string;
  id?: string;
  pageCount?: number;
  rawBlob?: Blob | null;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_action:
    | 'DOCUMENT_UPLOADED'
    | 'PAGE_STARTED'
    | 'PAGE_SUCCEEDED'
    | 'PAGE_FAILED'
    | 'PAGE_RETRIED'
    | 'PAGE_DOWNLOADED'
    | 'DOCUMENT_STITCHED'
    | 'JSON_GENERATED'
    | 'JSON_REGENERATED'
    | 'RECONCILIATION_EXECUTED'
    | 'VALIDATION_EXECUTED'
    | 'MAIL_MERGE_GENERATED'
    | 'DEMO_LOADED'
    | 'WORKSPACE_RESET'
    | 'SETTINGS_UPDATED';
  document_id?: string;
  document_name?: string;
  page?: number;
  previous_status?: string;
  new_status?: string;
  details?: string;
}

export type ActiveViewTab =
  | 'dashboard'
  | 'documents'
  | 'parsing_monitor'
  | 'extraction'
  | 'reconciliation'
  | 'validation'
  | 'mail_merge'
  | 'export_centre'
  | 'audit_log'
  | 'settings';

export interface AppSettings {
  concurrency: number;
  defaultParser: 'llamaindex' | 'pdf_native' | 'ocr_enhanced';
  useOCRForScanned: boolean;
  autoStitchOnComplete: boolean;
  strictValidationGate: boolean;
}
