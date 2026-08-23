import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WorkflowSteps } from './components/WorkflowSteps';
import { Step1Upload } from './components/Step1Upload';
import { Step2DocIntelligence } from './components/Step2DocIntelligence';
import { Step3Extraction } from './components/Step3Extraction';
import { Step4Validation } from './components/Step4Validation';
import { Step5Reconciliation } from './components/Step5Reconciliation';
import { Step6MailMerge } from './components/Step6MailMerge';
import { ParsingMonitor } from './components/ParsingMonitor';
import { ExportCentre } from './components/ExportCentre';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { FieldDetailModal } from './components/FieldDetailModal';

import {
  ActiveViewTab,
  AppSettings,
  IngestedFile,
  DocumentCaseItem,
  ClassifiedDocument,
  ProjectStageInfo,
  ChecklistRow,
  ExtractedField,
  ValidationCheckResult,
  ReconciliationItem,
  MailMergePatch,
  AuditLogEntry
} from './types';

import { DATA_DICTIONARY, SECTION_ORDER } from './data/dataDictionary';
import { DOCUMENT_CHECKLIST } from './data/documentChecklist';
import { evaluateValidationRules } from './lib/validationEngine';
import {
  parseSinglePage,
  stitchDocumentMarkdown,
  createDocumentCaseItem,
  calculateAccuratePageCount,
  splitTextIntoPageChunks,
  formatPageMarkdown
} from './lib/pageParserEngine';
import { runStructuredExtraction } from './lib/geminiExtractionEngine';
import { performEvidenceReconciliation } from './lib/reconciliationEngine';
import {
  clientClassifyDocument,
  clientInferStage,
  clientMailMerge
} from './lib/clientEngine';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('parsing_monitor');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [activeProcessingPage, setActiveProcessingPage] = useState<{
    docId: string;
    page: number;
  } | null>(null);

  // App Settings
  const [settings, setSettings] = useState<AppSettings>({
    concurrency: 4,
    defaultParser: 'llamaindex',
    useOCRForScanned: true,
    autoStitchOnComplete: true,
    strictValidationGate: true
  });

  // Core V11 Case State
  const [caseId, setCaseId] = useState<string>('CASE-2024-KUSUM-001');
  const [files, setFiles] = useState<IngestedFile[]>([]);
  const [documents, setDocuments] = useState<DocumentCaseItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Appraisal State
  const [classifiedDocs, setClassifiedDocs] = useState<ClassifiedDocument[]>([]);
  const [stageInfo, setStageInfo] = useState<ProjectStageInfo | null>(null);
  const [checklistRows, setChecklistRows] = useState<ChecklistRow[]>([]);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [checks, setChecks] = useState<ValidationCheckResult[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationItem[]>([]);
  const [patches, setPatches] = useState<MailMergePatch[]>([]);
  const [patchResults, setPatchResults] = useState<MailMergePatch[] | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Modal State
  const [selectedFieldDetail, setSelectedFieldDetail] = useState<ExtractedField | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>(SECTION_ORDER);

  // Helper to log audit actions
  const logAudit = (
    user_action: AuditLogEntry['user_action'],
    details?: string,
    docId?: string,
    docName?: string,
    page?: number
  ) => {
    const entry: AuditLogEntry = {
      id: 'LOG-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      document_id: docId,
      document_name: docName,
      page,
      user_action,
      details
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Check health and Gemini key availability on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasGeminiKey) {
          setHasGeminiKey(true);
        }
      })
      .catch((err) => console.warn('Health check not available:', err));

    // Initialize a blank workspace on mount
    initializeBlankWorkspace();
  }, []);

  // Update validation rules whenever fields change or documents change
  useEffect(() => {
    const results = evaluateValidationRules(fields, documents);
    setChecks(results);
  }, [fields, documents]);

  // Initialize blank dictionary fields with all required properties
  const initializeBlankWorkspace = () => {
    const initialFields: ExtractedField[] = DATA_DICTIONARY.map((def) => ({
      field_id: def['Field ID'],
      field_name: def['Field / Label'],
      label: def['Field / Label'],
      section: def.Section,
      json_path: def['JSON Path'],
      requirement: def.Requirement,
      primary_source: def['Primary Source'],
      rule: def['Validation / Rule'],
      value: null,
      status: 'MISSING',
      source_document: '',
      source_page: null,
      source_section: '',
      evidence: '',
      confidence: 0.0,
      extraction_method: 'gemini_markdown',
      review_required: false
    }));
    setFields(initialFields);
  };

  // Reset workspace
  const handleReset = () => {
    setFiles([]);
    setDocuments([]);
    setSelectedDocId(null);
    setClassifiedDocs([]);
    setStageInfo(null);
    setChecklistRows([]);
    setFields([]);
    setChecks([]);
    setReconciliations([]);
    setPatches([]);
    setPatchResults(null);
    setActiveTab('documents');
    logAudit('WORKSPACE_RESET', 'Workspace reset to NO DATA');
  };

  // Handle uploaded files
  const handleFilesChange = (newFiles: IngestedFile[]) => {
    setFiles(newFiles);

    const newDocs: DocumentCaseItem[] = newFiles.map((file) => {
      const pageCount = file.pageCount || calculateAccuratePageCount(file);
      return createDocumentCaseItem(file, pageCount);
    });

    setDocuments(newDocs);
    if (newDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(newDocs[0].id);
    }

    logAudit('DOCUMENT_UPLOADED', `Uploaded ${newFiles.length} documents`);
  };

  // Parse a single page with LED tracker
  const handleParsePage = async (docId: string, pageNum: number) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    setActiveProcessingPage({ docId, page: pageNum });
    logAudit('PAGE_STARTED', `Parsing page ${pageNum} via ${settings.defaultParser}`, docId, doc.filename, pageNum);

    // Call pageParserEngine
    const parseResult = await parseSinglePage(doc, pageNum, {
      useOCR: settings.useOCRForScanned
    });

    // Update document state
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? parseResult.updatedDoc : d))
    );

    setActiveProcessingPage(null);
    logAudit(
      parseResult.pageMetadata.status === 'SUCCESS' ? 'PAGE_SUCCEEDED' : 'PAGE_FAILED',
      parseResult.pageMetadata.error || `Completed in ${parseResult.pageMetadata.processing_time_seconds}s`,
      docId,
      doc.filename,
      pageNum
    );
  };

  // Retry only failed pages for a document
  const handleRetryFailedPages = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    const failedPages = doc.pages.filter((p) => p.status === 'FAILED');
    setIsProcessing(true);
    logAudit('PAGE_RETRIED', `Retrying ${failedPages.length} failed pages`, docId, doc.filename);

    for (const p of failedPages) {
      await handleParsePage(docId, p.page);
    }
    setIsProcessing(false);
  };

  // Reprocess all pages for a document
  const handleReprocessAllPages = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    setIsProcessing(true);
    logAudit('PAGE_STARTED', `Reprocessing all ${doc.total_pages} pages`, docId, doc.filename);

    for (let p = 1; p <= doc.total_pages; p++) {
      await handleParsePage(docId, p);
    }
    setIsProcessing(false);
  };

  // Parse all ingested documents across entire dossier
  const handleParseAllDocuments = async () => {
    setIsProcessing(true);
    logAudit('PAGE_STARTED', `Batch parsing all ${documents.length} ingested documents`);

    for (const doc of documents) {
      for (let p = 1; p <= doc.total_pages; p++) {
        const existingPage = doc.pages.find((page) => page.page === p);
        if (!existingPage || existingPage.status !== 'SUCCESS') {
          await handleParsePage(doc.id, p);
        }
      }
    }
    setIsProcessing(false);
  };

  // Execute Step 2: Document Intelligence
  const handleRunClassification = async () => {
    setIsProcessing(true);
    logAudit('DOCUMENT_UPLOADED', 'Executing document classification and stage inference');

    try {
      const combinedText = files.map((f) => `--- ${f.name} ---\n${f.text}`).join('\n\n');

      // 1. Infer Project Stage
      let stageData: ProjectStageInfo | null = null;
      try {
        const stageRes = await fetch('/api/gemini/stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: combinedText })
        });
        if (stageRes.ok) {
          stageData = await stageRes.json();
        }
      } catch (e) {
        console.warn('API stage inference error:', e);
      }

      if (!stageData || !stageData.project_stage) {
        stageData = clientInferStage(combinedText, files);
      }
      setStageInfo(stageData);

      // 2. Classify individual documents
      const classifiedList: ClassifiedDocument[] = [];
      for (const file of files) {
        let clsData: any = null;
        try {
          const clsRes = await fetch('/api/gemini/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              text: file.text,
              checklist: DOCUMENT_CHECKLIST
            })
          });
          if (clsRes.ok) {
            clsData = await clsRes.json();
          }
        } catch (e) {
          console.warn(`API classification error for ${file.name}:`, e);
        }

        if (!clsData || !clsData.document_type) {
          clsData = clientClassifyDocument(file.name, file.text, DOCUMENT_CHECKLIST);
        }

        classifiedList.push({
          filename: file.name,
          document_type: clsData.document_type || 'General Document',
          group: clsData.group || 'Project Documents',
          priority: clsData.priority || 'Standard',
          confidence: clsData.confidence || 0.9,
          key_outputs: clsData.key_outputs || [],
          reason: clsData.reason || 'Verified match'
        });
      }
      setClassifiedDocs(classifiedList);

      // 3. Build Checklist Gap Matrix
      const matrix: ChecklistRow[] = DOCUMENT_CHECKLIST.map((item) => {
        const matched = classifiedList.filter(
          (c) =>
            c.document_type.toLowerCase() === item.Document.toLowerCase() ||
            item.Document.toLowerCase().includes(c.document_type.toLowerCase()) ||
            c.document_type.toLowerCase().includes(item.Document.toLowerCase())
        );

        const isPresent = matched.length > 0;
        let status: 'PRESENT' | 'REQUIRED' | 'OPTIONAL / CONDITIONAL' = 'PRESENT';

        if (!isPresent) {
          status = item.Priority === 'Mandatory' ? 'REQUIRED' : 'OPTIONAL / CONDITIONAL';
        }

        return {
          Group: item.Group,
          Document: item.Document,
          Priority: item.Priority,
          Status: status,
          'Main outputs': item['Main outputs'],
          'Matched files': matched.map((m) => m.filename).join(', ')
        };
      });

      setChecklistRows(matrix);
      setActiveTab('dashboard');
      logAudit('DOCUMENT_UPLOADED', `Classified ${classifiedList.length} files`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Step 3: Evidence-First Structured Markdown Extraction
  const handleRunExtraction = async () => {
    setIsProcessing(true);
    logAudit('JSON_GENERATED', 'Running evidence-first extraction across cached page markdowns');

    try {
      const extractedResults = await runStructuredExtraction(
        DATA_DICTIONARY,
        documents
      );

      setFields(extractedResults);
      setActiveTab('extraction');
      const foundCount = extractedResults.filter((f) => f.status === 'FOUND' || f.status === 'CALCULATED').length;
      logAudit('JSON_GENERATED', `Extracted ${foundCount} of ${extractedResults.length} fields with evidence`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Step 5: Cross-Document Reconciliation
  const handleRunReconciliation = async () => {
    setIsProcessing(true);
    logAudit('RECONCILIATION_EXECUTED', 'Evaluating multi-document cross corroboration');

    try {
      const reconItems = await performEvidenceReconciliation(fields, documents);
      setReconciliations(reconItems);
      setActiveTab('reconciliation');
      const conflicts = reconItems.filter((r) => r.status === 'conflict').length;
      logAudit('RECONCILIATION_EXECUTED', `Reconciled ${reconItems.length} facts (${conflicts} conflicts)`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Step 6: Create Patch Plan
  const handleCreatePatchPlan = async () => {
    setIsProcessing(true);
    logAudit('MAIL_MERGE_GENERATED', 'Building intelligent mail merge patch plan');

    try {
      const templateBlocks = [
        { loc: 'P0', text: 'CREDIT APPRAISAL & SANCTION NOTE — [BORROWER_NAME]' },
        { loc: 'P1', text: 'Rupee Term Loan under RESCO Mode for 2.50 MW Solar PV Plant at Badu, Nagaur' },
        { loc: 'T0 R1', text: 'Borrower: [BORROWER_NAME]' },
        { loc: 'T0 R2', text: 'Proposed Term Loan Amount: [LOAN_AMOUNT]' },
        { loc: 'T0 R3', text: 'PPA Tariff: [TARIFF] per kWh fixed for 25 years' }
      ];

      let patchList: MailMergePatch[] = [];
      try {
        const res = await fetch('/api/gemini/mailmerge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks: templateBlocks,
            fields: fields
          })
        });
        if (res.ok) {
          const data = await res.json();
          patchList = data.patches || [];
        }
      } catch (e) {
        console.warn('MailMerge API error:', e);
      }

      if (patchList.length === 0) {
        patchList = clientMailMerge(templateBlocks, fields);
      }

      setPatches(patchList);
      logAudit('MAIL_MERGE_GENERATED', `Generated ${patchList.length} template surgical patches`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply Patches
  const handleApplyPatches = () => {
    setPatchResults(patches.map((p) => ({ ...p, applied: true })));
    logAudit('MAIL_MERGE_GENERATED', `Applied ${patches.length} patches to sanction note`);
  };

  // Single field update (Audited override)
  const handleUpdateField = (fieldId: string, updated: Partial<ExtractedField>) => {
    setFields((prev) =>
      prev.map((f) => (f.field_id === fieldId ? { ...f, ...updated } : f))
    );
    logAudit('JSON_REGENERATED', `Manually updated field ${fieldId}: value="${updated.value}"`);
  };

  const handleUpdateReconciliation = (
    fieldId: string,
    updated: Partial<ReconciliationItem>
  ) => {
    setReconciliations((prev) =>
      prev.map((r) => (r.field_id === fieldId ? { ...r, ...updated } : r))
    );
    logAudit('RECONCILIATION_EXECUTED', `Manual reconciliation decision on ${fieldId}`);
  };

  // Workflow status calculations
  const totalPages = documents.reduce((sum, d) => sum + d.total_pages, 0);
  const successPages = documents.reduce(
    (sum, d) => sum + d.pages.filter((p) => p.status === 'SUCCESS').length,
    0
  );
  const failedPages = documents.reduce(
    (sum, d) => sum + d.pages.filter((p) => p.status === 'FAILED').length,
    0
  );
  const totalParsedPct = totalPages > 0 ? Math.round((successPages / totalPages) * 100) : 0;

  const blockingValidationCount = checks.filter((c) => c.status === 'FAIL').length;

  const statusMap = {
    documents: files.length > 0,
    parsing: { total: totalPages, success: successPages, failed: failedPages },
    intelligence: classifiedDocs.length > 0,
    extraction: {
      found: fields.filter((f) => f.status === 'FOUND' || f.status === 'CALCULATED').length,
      total: fields.length
    },
    reconciliation: {
      total: reconciliations.length,
      conflicts: reconciliations.filter((r) => r.status === 'conflict').length
    },
    validation: {
      pass: checks.length > 0 && blockingValidationCount === 0,
      blockingCount: blockingValidationCount
    },
    mailMerge: patches.length > 0
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Navbar with Mode Switch & Status */}
      <Navbar
        hasGeminiKey={hasGeminiKey}
        onReset={handleReset}
        isProcessing={isProcessing}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalParsedPct={totalParsedPct}
      />

      {/* Main Workflow Steps Bar */}
      <WorkflowSteps
        currentTab={activeTab}
        onTabClick={setActiveTab}
        statusMap={statusMap}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Step 1: Intake & Documents */}
        {activeTab === 'documents' && (
          <Step1Upload
            files={files}
            onFilesChange={handleFilesChange}
            onNext={() => setActiveTab('parsing_monitor')}
            isProcessing={isProcessing}
            useOCR={settings.useOCRForScanned}
            onToggleOCR={(enabled) =>
              setSettings((prev) => ({ ...prev, useOCRForScanned: enabled }))
            }
          />
        )}

        {/* Step 2: Page-Level Ingestion & Parser Monitor (LED style) */}
        {activeTab === 'parsing_monitor' && (
          <ParsingMonitor
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDoc={setSelectedDocId}
            onParsePage={handleParsePage}
            onRetryFailedPages={handleRetryFailedPages}
            onReprocessAllPages={handleReprocessAllPages}
            onParseAllDocuments={handleParseAllDocuments}
            isProcessing={isProcessing}
            activeProcessingPage={activeProcessingPage}
            onProceedToExtraction={() => {
              if (classifiedDocs.length === 0) {
                handleRunClassification();
              } else {
                setActiveTab('dashboard');
              }
            }}
          />
        )}

        {/* Step 3: Doc Intelligence (Checklist Matrix & Stage inference) */}
        {activeTab === 'dashboard' && (
          <Step2DocIntelligence
            classifiedDocs={classifiedDocs}
            stageInfo={stageInfo}
            checklistRows={checklistRows}
            onRunClassification={handleRunClassification}
            onNext={() => setActiveTab('extraction')}
            isProcessing={isProcessing}
            fileCount={files.length}
          />
        )}

        {/* Step 4: Structured Data Dictionary Extraction */}
        {activeTab === 'extraction' && (
          <Step3Extraction
            fields={fields}
            onRunExtraction={handleRunExtraction}
            onUpdateField={handleUpdateField}
            onSelectFieldDetail={setSelectedFieldDetail}
            onNext={() => setActiveTab('validation')}
            isProcessing={isProcessing}
            selectedSections={selectedSections}
            onToggleSection={(sec) =>
              setSelectedSections((prev) =>
                prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
              )
            }
            allSections={SECTION_ORDER}
          />
        )}

        {/* Step 5: Evidence & Validation Rules */}
        {activeTab === 'validation' && (
          <Step4Validation
            checks={checks}
            fields={fields}
            onNext={() => setActiveTab('reconciliation')}
            onRefreshChecks={() => setChecks(evaluateValidationRules(fields, documents))}
            isProcessing={isProcessing}
          />
        )}

        {/* Step 6: Cross-Document Reconciliation */}
        {activeTab === 'reconciliation' && (
          <Step5Reconciliation
            reconciliations={reconciliations}
            onRunReconciliation={handleRunReconciliation}
            onNext={() => setActiveTab('mail_merge')}
            onUpdateReconciliation={handleUpdateReconciliation}
            isProcessing={isProcessing}
            hasClassifiedDocs={classifiedDocs.length > 0}
          />
        )}

        {/* Step 7: Mail Merge & Sanction Note */}
        {activeTab === 'mail_merge' && (
          <Step6MailMerge
            patches={patches}
            patchResults={patchResults}
            fields={fields}
            checks={checks}
            onCreatePatchPlan={handleCreatePatchPlan}
            onApplyPatches={handleApplyPatches}
            isProcessing={isProcessing}
          />
        )}

        {/* View: Export Centre */}
        {activeTab === 'export_centre' && (
          <ExportCentre
            documents={documents}
            fields={fields}
            reconciliations={reconciliations}
            validations={checks}
            patches={patches}
            auditLogs={auditLogs}
          />
        )}

        {/* View: Audit Log */}
        {activeTab === 'audit_log' && <AuditLogView logs={auditLogs} />}

        {/* View: Settings */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
            onClearCache={handleReset}
          />
        )}
      </main>

      {/* Field Detail & Audit Modal */}
      {selectedFieldDetail && (
        <FieldDetailModal
          field={selectedFieldDetail}
          onClose={() => setSelectedFieldDetail(null)}
          onSave={handleUpdateField}
        />
      )}
    </div>
  );
}

export default App;
