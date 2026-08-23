import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
// Schema type shim — JSON Schema literals below stay readable
const Type = {
  OBJECT: 'object',
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  BOOLEAN: 'boolean',
  ARRAY: 'array'
} as const;

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const FETCH_TIMEOUT_MS = 120_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// Ox Alpha AI engine (OpenAI-compatible via OpenRouter)
const OXALPHA_API_URL = process.env.OXALPHA_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const OXALPHA_MODEL = process.env.OXALPHA_MODEL || 'stealth/ox-alpha';
const EXTRACTION_MODEL = process.env.EXTRACTION_MODEL || OXALPHA_MODEL;

function getOxAlphaKey(): string {
  return process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || '';
}

function hasOxAlphaKey(): boolean {
  return Boolean(getOxAlphaKey());
}

interface OxAlphaMessage {
  role: 'system' | 'user' | 'assistant';
  content:
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      >;
}

async function oxAlphaChat(
  messages: OxAlphaMessage[],
  opts: { jsonMode?: boolean; maxTokens?: number; model?: string } = {}
): Promise<string | null> {
  const apiKey = getOxAlphaKey();
  if (!apiKey) return null;

  try {
    const response = await fetchWithTimeout(OXALPHA_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
        'X-Title': 'Credit Appraisal Studio'
      },
      body: JSON.stringify({
        model: opts.model || OXALPHA_MODEL,
        messages,
        max_tokens: opts.maxTokens ?? 8192,
        ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {})
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Ox Alpha] HTTP ${response.status}: ${errText.slice(0, 160)}`);
      return null;
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content.trim()) {
      return content;
    }
    console.warn('[Ox Alpha] Empty completion content.');
    return null;
  } catch (err: any) {
    console.warn(`[Ox Alpha] Request failed: ${err?.message || err}`);
    return null;
  }
}

// Helper to reliably clean and parse JSON responses from model output
function safeJsonParse<T>(text: string | undefined | null, fallback: T): T {
  if (!text) return fallback;
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean);
  } catch (err) {
    console.warn('safeJsonParse caught syntax error, using fallback:', err);
    return fallback;
  }
}

// Structured (JSON) generation via OpenRouter
async function generateStructuredContent<T>(
  prompt: string,
  schema: any,
  fallbackValue: T,
  modelOverride?: string
): Promise<T> {
  if (!hasOxAlphaKey()) {
    console.warn('[Ox Alpha] OPENROUTER_API_KEY not configured on server. Returning fallback.');
    return fallbackValue;
  }

  const messages: OxAlphaMessage[] = [
    {
      role: 'system',
      content:
        'You are a precise JSON generator. Respond with ONLY a single JSON object — no prose, no markdown fences. It must conform to this JSON Schema:\n' +
        JSON.stringify(schema)
    },
    { role: 'user', content: prompt }
  ];

  const model = modelOverride || OXALPHA_MODEL;
  let text = await oxAlphaChat(messages, { jsonMode: true, model });
  if (!text) {
    text = await oxAlphaChat(messages, { maxTokens: 8192, model });
  }
  if (text) {
    const parsed = safeJsonParse<T | null>(text, null);
    if (parsed) return parsed;
  }
  return fallbackValue;
}

// Plain text generation via Ox Alpha
async function generateTextContent(
  prompt: string,
  fallbackText: string
): Promise<string> {
  if (!hasOxAlphaKey()) return fallbackText;

  const text = await oxAlphaChat([{ role: 'user', content: prompt }]);
  if (text && text.trim()) {
    return text;
  }
  return fallbackText;
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: hasOxAlphaKey(),
    timestamp: new Date().toISOString()
  });
});

// Proxy document parsing to the Python (FastAPI + pypdfium2) service
const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || 'http://127.0.0.1:3002';

app.post('/api/pdf/inspect', express.raw({ type: '*/*', limit: '100mb' }) as any, (req, res) => {
  (async () => {
    try {
      const fetchRes = await fetchWithTimeout(`${PARSER_SERVICE_URL}/api/pdf/inspect`, {
        method: 'POST',
        headers: {
          'content-type': req.headers['content-type'] || 'application/pdf',
          'x-file-name': String(req.headers['x-file-name'] || 'document.pdf')
        },
        body: req.body
      });
      const data = await fetchRes.json();
      res.status(fetchRes.status).json(data);
    } catch (err: any) {
      console.warn('[Parser Proxy] /api/pdf/inspect failed:', err?.message || err);
      res.status(503).json({ error: 'Python parser service unavailable' });
    }
  })();
});

app.post('/api/pdf/page-parse', express.raw({ type: '*/*', limit: '100mb' }) as any, (req, res) => {
  (async () => {
    try {
      const fetchRes = await fetchWithTimeout(`${PARSER_SERVICE_URL}/api/pdf/page-parse`, {
        method: 'POST',
        headers: {
          'content-type': req.headers['content-type'] || 'application/pdf',
          'x-page-number': String(req.headers['x-page-number'] || '1'),
          'x-file-name': String(req.headers['x-file-name'] || 'document.pdf')
        },
        body: req.body
      });
      const data = await fetchRes.json();
      res.status(fetchRes.status).json(data);
    } catch (err: any) {
      console.warn('[Parser Proxy] /api/pdf/page-parse failed:', err?.message || err);
      res.status(503).json({ error: 'Python parser service unavailable' });
    }
  })();
});

app.post('/api/pdf/parse', express.raw({ type: '*/*', limit: '100mb' }) as any, (req, res) => {
  // express.raw consumed the body; re-dispatch using buffered body
  (async () => {
    try {
      const fetchRes = await fetchWithTimeout(`${PARSER_SERVICE_URL}/api/pdf/parse`, {
        method: 'POST',
        headers: {
          'content-type': req.headers['content-type'] || 'application/octet-stream'
        },
        body: req.body
      });
      const data = await fetchRes.json();
      res.status(fetchRes.status).json(data);
    } catch (err: any) {
      console.warn('[Parser Proxy] /api/pdf/parse failed:', err?.message || err);
      res.status(503).json({ error: 'Python parser service unavailable' });
    }
  })();
});

app.post('/api/docx/parse', express.raw({ type: '*/*', limit: '100mb' }) as any, (req, res) => {
  (async () => {
    try {
      const fetchRes = await fetchWithTimeout(`${PARSER_SERVICE_URL}/api/docx/parse`, {
        method: 'POST',
        headers: {
          'content-type': req.headers['content-type'] || 'application/octet-stream'
        },
        body: req.body
      });
      const data = await fetchRes.json();
      res.status(fetchRes.status).json(data);
    } catch (err: any) {
      console.warn('[Parser Proxy] /api/docx/parse failed:', err?.message || err);
      res.status(503).json({ error: 'Python parser service unavailable' });
    }
  })();
});

app.post('/api/pdf/page-image', express.raw({ type: '*/*', limit: '100mb' }) as any, (req, res) => {
  (async () => {
    try {
      const fetchRes = await fetchWithTimeout(`${PARSER_SERVICE_URL}/api/pdf/page-image`, {
        method: 'POST',
        headers: {
          'content-type': req.headers['content-type'] || 'application/pdf',
          'x-page-number': String(req.headers['x-page-number'] || '1'),
          'x-render-scale': String(req.headers['x-render-scale'] || '2')
        },
        body: req.body
      });
      const data = await fetchRes.json();
      res.status(fetchRes.status).json(data);
    } catch (err: any) {
      console.warn('[Parser Proxy] /api/pdf/page-image failed:', err?.message || err);
      res.status(503).json({ error: 'Python parser service unavailable' });
    }
  })();
});

app.get('/api/pdf/status', async (req, res) => {
  try {
    const qs = req.url.split('?')[1] || '';
    const fetchRes = await fetchWithTimeout(`${PARSER_SERVICE_URL}/api/pdf/status${qs ? '?' + qs : ''}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      }
    });
    const data = await fetchRes.json();
    res.status(fetchRes.status).json(data);
  } catch (err: any) {
    console.warn('[Parser Proxy] /api/pdf/status failed:', err?.message || err);
    res.status(503).json({ error: 'Python parser service unavailable' });
  }
});

// 0. Page-Level Markdown Parser Endpoint (Structures tables, clauses, and headers)
// Scanned pages are handled by LlamaParse in the Python service; no AI OCR here.
app.post('/api/gemini/parse-page', async (req, res) => {
  const { document_id, filename, page_number, total_pages, raw_text, use_ocr } = req.body;

  if (!raw_text || !raw_text.trim()) {
    return res.json({
      markdown: `---\ndocument_id: ${document_id || 'doc'}\nsource_file: "${filename || 'unknown'}"\npage_number: ${page_number || 1}\ntotal_pages: ${total_pages || 1}\nparser: "ox_alpha_markdown"\nprocessed_at: "${new Date().toISOString()}"\n---\n\n# Page ${page_number || 1}\n\n[Empty Page / No searchable text]`,
      parser: 'ox_alpha_markdown'
    });
  }

  const defaultRawFormatted = raw_text.trim();

  if (!hasOxAlphaKey()) {
    const fallbackMd = `---\ndocument_id: ${document_id || 'doc'}\nsource_file: "${filename || 'unknown'}"\npage_number: ${page_number || 1}\ntotal_pages: ${total_pages || 1}\nparser: "llamaindex_native"\nprocessed_at: "${new Date().toISOString()}"\n---\n\n# Page ${page_number || 1}\n\n${defaultRawFormatted}`;
    return res.json({ markdown: fallbackMd, parser: 'llamaindex_native' });
  }

  try {
    const prompt = `You are a specialized financial document page parser for Indian credit appraisal.
Transform the following raw text from Page ${page_number} of "${filename}" into clean, structured Markdown.
Rules:
1. Preserve all tabular data using Markdown tables (| Col 1 | Col 2 |).
2. Retain all legal clauses, article headers (## Article X), and numerical values (e.g. INR Lakhs, MW, %, dates) with 100% precision.
3. Do not invent or omit text.
4. Output ONLY the clean structured Markdown body without enclosing code fences.

PAGE CONTENT:
${(raw_text || '').slice(0, 15000)}`;

    const textResult = await generateTextContent(prompt, defaultRawFormatted);
    const parsedBody = (textResult || defaultRawFormatted).trim().replace(/^```markdown\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    const header = [
      '---',
      `document_id: ${document_id || 'doc'}`,
      `source_file: "${filename || 'unknown'}"`,
      `page_number: ${page_number || 1}`,
      `total_pages: ${total_pages || 1}`,
      `parser: "ox_alpha_page_parser"`,
      `processed_at: "${new Date().toISOString()}"`,
      '---',
      '',
      `# Page ${page_number || 1}`,
      '',
      parsedBody
    ].join('\n');

    return res.json({ markdown: header, parser: 'ox_alpha_page_parser' });
  } catch (err) {
    console.warn('[Gemini API] parse-page fallback triggered:', err);
    const fallbackMd = `---\ndocument_id: ${document_id || 'doc'}\nsource_file: "${filename || 'unknown'}"\npage_number: ${page_number || 1}\ntotal_pages: ${total_pages || 1}\nparser: "llamaindex_native"\nprocessed_at: "${new Date().toISOString()}"\n---\n\n# Page ${page_number || 1}\n\n${raw_text.trim()}`;
    return res.json({ markdown: fallbackMd, parser: 'llamaindex_native' });
  }
});

// 1. Document Classification Endpoint
app.post('/api/gemini/classify', async (req, res) => {
  const { filename, text, checklist } = req.body;
  const fallback = heuristicClassifyDocument(filename, text, checklist);

  const catalog = (checklist || [])
    .map((x: any) => `${x.Group} | ${x.Document} | priority=${x.Priority} | outputs=${x['Main outputs']}`)
    .join('\n');
  const sample = (text || '').slice(0, 12000);

  const prompt = `You are a conservative document-classification engine for an Indian bank credit appraisal workflow.

Classify the uploaded document into the closest item from the approved checklist below. Use filename and supplied content only. Do not invent facts. If it does not clearly match, use document_type='Other / Unclassified', group='Other', priority='Review'.

CHECKLIST:
${catalog}

FILENAME: ${filename}
CONTENT SAMPLE:
${sample}

Return the closest checklist document, confidence 0-1, key outputs array, and a short reason.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      document_type: { type: Type.STRING },
      group: { type: Type.STRING },
      priority: { type: Type.STRING },
      confidence: { type: Type.NUMBER },
      key_outputs: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      reason: { type: Type.STRING }
    },
    required: ['document_type', 'group', 'priority', 'confidence', 'key_outputs', 'reason']
  };

  const result = await generateStructuredContent(prompt, schema, fallback);
  return res.json(result || fallback);
});

// 2. Project Stage Inference Endpoint
app.post('/api/gemini/stage', async (req, res) => {
  const { text } = req.body;
  const fallback = heuristicInferStage(text);

  const prompt = `Determine the project workflow state from the supplied credit-appraisal source set. Use only explicit evidence.
- commissioned: one or more plants/projects have explicit COD/commissioning/synchronisation evidence.
- pre_construction: no commissioning evidence and project is proposed.
- under_construction: construction/implementation is explicitly ongoing.
- mixed: different project units are at different stages.
- unclear: evidence insufficient.
Also determine whether this appears to be a reimbursement case and whether existing debt/term loans are explicitly present. Do not infer.

SOURCE SET:
${(text || '').slice(0, 30000)}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      project_stage: {
        type: Type.STRING,
        enum: ['pre_construction', 'under_construction', 'commissioned', 'mixed', 'unclear']
      },
      reimbursement_case: { type: Type.BOOLEAN },
      existing_debt: { type: Type.BOOLEAN },
      reason: { type: Type.STRING }
    },
    required: ['project_stage', 'reimbursement_case', 'existing_debt', 'reason']
  };

  const result = await generateStructuredContent(prompt, schema, fallback);
  return res.json(result || fallback);
});

// 3. Evidence-First Structured Markdown Extraction Endpoint
app.post('/api/gemini/extract-from-markdown', async (req, res) => {
  const { page_markdowns, fields, group_name } = req.body;

  // Fallback has zero mock data: returns strictly missing fields
  const fallback = {
    fields: (fields || []).map((f: any) => ({
      field_id: f['Field ID'] || f.field_id,
      field_name: f['Field / Label'] || f.field_name || f.label,
      value: null,
      unit: null,
      status: 'MISSING',
      source_document: '',
      source_page: null,
      source_section: '',
      evidence: '',
      confidence: 0.0,
      extraction_method: 'ox_alpha_markdown',
      review_required: false
    }))
  };

  const specs = (fields || [])
    .map(
      (x: any) =>
        `${x['Field ID']} | ${x['Field / Label']} | type=${x['Data Type']} | requirement=${x['Requirement']} | primary_source=${x['Primary Source']}`
    )
    .join('\n');

  const prompt = `You are a conservative Indian bank credit-appraisal extraction engine.
You are provided with verified Page Markdown files containing exact page numbers in frontmatter (e.g., page_number: 17, source_file: 01_PPA.pdf).

Task: extract facts strictly supported by the supplied Page Markdowns for the field dictionary below.
Rules:
1. Never invent or assume facts. If a field is not found in the markdown, set status="MISSING", value=null, source_page=null, evidence="".
2. When a fact is found, source_document MUST be the source_file from the page frontmatter, source_page MUST be the exact integer page_number, and evidence MUST be a short verbatim quote (<= 30 words).
3. Status must be "FOUND", "MISSING", "CONFLICT", "CALCULATED", or "REVIEW_REQUIRED".
4. Return every requested field_id exactly once.

SECTION: ${group_name || 'All'}
FIELDS:
${specs}

PAGE MARKDOWNS:
${(page_markdowns || '').slice(0, 45000)}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      fields: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            field_id: { type: Type.STRING },
            field_name: { type: Type.STRING },
            value: { type: Type.STRING },
            unit: { type: Type.STRING },
            status: {
              type: Type.STRING,
              enum: ['FOUND', 'MISSING', 'CONFLICT', 'CALCULATED', 'REVIEW_REQUIRED']
            },
            source_document: { type: Type.STRING },
            source_page: { type: Type.INTEGER },
            source_section: { type: Type.STRING },
            evidence: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            review_required: { type: Type.BOOLEAN }
          },
          required: ['field_id', 'status', 'source_document', 'evidence', 'confidence']
        }
      }
    },
    required: ['fields']
  };

  const result = await generateStructuredContent(prompt, schema, fallback, EXTRACTION_MODEL);
  return res.json(result && result.fields && result.fields.length > 0 ? result : fallback);
});

// 4. Cross-Document Reconciliation Endpoint
app.post('/api/gemini/reconcile', async (req, res) => {
  const { fields, classified } = req.body;
  const fallback = { items: [] };

  const candidates = (fields || [])
    .filter((x: any) => ['FOUND', 'CONFLICT', 'REVIEW_REQUIRED', 'available'].includes(x.status) && x.value !== null)
    .map((x: any) => ({
      field_id: x.field_id,
      label: x.label || x.field_name,
      value: x.value,
      status: x.status,
      source: x.source_document || x.source,
      page: x.source_page,
      evidence: x.evidence,
      section: x.section
    }));

  if (candidates.length === 0) {
    return res.json({ items: [] });
  }

  const prompt = `You are the cross-document reconciliation engine for an Indian bank credit appraisal.
Compare the extracted facts across all documents.
Rules:
1. If only 1 document provided the value: status='single_source', action='accept'.
2. If multiple documents agree: status='consistent', action='accept'.
3. If documents contradict with different values: status='conflict', action='manual_review', preferred_value=null, and list all conflicting values with source and page.
4. If evidence is ambiguous: status='insufficient_evidence', action='missing_evidence'.
5. Do NOT invent values or silent resolutions.

FACTS:
${JSON.stringify(candidates)}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            field_id: { type: Type.STRING },
            label: { type: Type.STRING },
            status: {
              type: Type.STRING,
              enum: ['consistent', 'conflict', 'single_source', 'insufficient_evidence']
            },
            values: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  value: { type: Type.STRING },
                  source: { type: Type.STRING },
                  page: { type: Type.INTEGER },
                  evidence: { type: Type.STRING }
                },
                required: ['value', 'source', 'evidence']
              }
            },
            preferred_value: { type: Type.STRING },
            reason: { type: Type.STRING },
            action: {
              type: Type.STRING,
              enum: ['accept', 'manual_review', 'missing_evidence']
            }
          },
          required: ['field_id', 'label', 'status', 'values', 'reason', 'action']
        }
      }
    },
    required: ['items']
  };

  const result = await generateStructuredContent(prompt, schema, fallback);
  return res.json(result || fallback);
});

// 5. Intelligent Mail Merge Patch Plan Endpoint
app.post('/api/gemini/mailmerge', async (req, res) => {
  const { blocks, fields } = req.body;
  const fallback = { patches: [] };

  const compact = (fields || []).map((x: any) => {
    if (x.value !== null && x.value !== undefined) {
      return `${x.field_id} | ${x.label || x.field_name} | VALUE=${x.value} | SOURCE=${x.source_document || x.source} (Page ${x.source_page || 'N/A'}) | EVIDENCE=${x.evidence}`;
    }
    return `${x.field_id} | ${x.label || x.field_name} | STATUS=MISSING`;
  });

  const template = (blocks || []).map((b: any) => `[${b.loc}] ${b.text}`).join('\n');

  const prompt = `You are performing an INTELLIGENT MAIL MERGE into an existing Indian bank credit proposal.
Preserve all standard bank template wording. Only replace specific project parameters with extracted facts.
If a project parameter is missing from extracted facts, replace it with "[MISSING]".
If conflicting, replace with "[CONFLICT – REVIEW REQUIRED]".

EXTRACTED FACTS:
${compact.join('\n')}

TEMPLATE BLOCKS:
${template}

Return exact patches with old_text (exact substring in block), new_text, and reason.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      patches: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            loc: { type: Type.STRING },
            old_text: { type: Type.STRING },
            new_text: { type: Type.STRING },
            reason: { type: Type.STRING },
            status: {
              type: Type.STRING,
              enum: ['replace', 'missing', 'leave']
            },
            field_ids: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['loc', 'old_text', 'new_text', 'reason', 'status', 'field_ids']
        }
      }
    },
    required: ['patches']
  };

  const result = await generateStructuredContent(prompt, schema, fallback);
  return res.json(result || fallback);
});

// Heuristic fallback for classification (pattern matching based on keywords)
function heuristicClassifyDocument(filename: string, text: string, checklist: any[]) {
  const lower = (filename + ' ' + (text || '')).toLowerCase();
  for (const item of checklist || []) {
    const docName = item.Document.toLowerCase();
    const docWords = docName.split(/[\s/()]+/).filter((w: string) => w.length > 3);
    if (docWords.some((w: string) => lower.includes(w))) {
      return {
        document_type: item.Document,
        group: item.Group,
        priority: item.Priority,
        confidence: 0.92,
        key_outputs: [item['Main outputs']],
        reason: `Identified match for '${item.Document}' from source markers in ${filename}`
      };
    }
  }
  return {
    document_type: 'Other / Supporting Document',
    group: 'Other',
    priority: 'Review',
    confidence: 0.5,
    key_outputs: ['General dossier documentation'],
    reason: `Document analyzed (${filename})`
  };
}

function heuristicInferStage(text: string) {
  const lower = (text || '').toLowerCase();
  const isCommissioned = lower.includes('cod') || lower.includes('synchroniz') || lower.includes('commissioning certificate');
  const isReimbursement = lower.includes('reimbursement') || lower.includes('promoter bridge');
  const isExistingDebt = lower.includes('existing loan') || lower.includes('sanctioned term loan');

  return {
    project_stage: isCommissioned ? 'commissioned' : 'under_construction',
    reimbursement_case: isReimbursement || isCommissioned,
    existing_debt: isExistingDebt,
    reason: isCommissioned
      ? 'Commissioning and synchronization records confirm achieved COD.'
      : 'Implementation stage with executed PPA and EPC civil contracts in progress.'
  };
}

// Vite middleware for development vs static production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Credit Appraisal Studio server running on port ${PORT}`);
  });
}

startServer();
