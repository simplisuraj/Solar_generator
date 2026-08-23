"""
Credit Appraisal Studio — Python document parsing service.

Primary PDF parsing uses the LlamaParse API (LlamaIndex cloud) when
LLAMA_CLOUD_API_KEY is configured — it handles scanned pages, tables and
complex layouts and returns page-aligned Markdown. Falls back to local
pypdfium2 extraction (+ AI OCR via the app's Ox Alpha pipeline) when the
key is absent or the API fails. The React UI and the existing /api/gemini/*
flow are untouched; Express proxies /api/pdf/* to this service.
"""
import io
import os
import re
import time

import base64
import httpx

import pypdfium2 as pdfium
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import JSONResponse

app = FastAPI(title="CAS Parser Service")

# Pages whose extracted text is below this density are flagged as scanned
SCANNED_CHARS_PER_KB = 20
MIN_TEXT_CHARS = 20

LLAMA_CLOUD_BASE = os.environ.get("LLAMA_CLOUD_BASE_URL", "https://api.cloud.llamaindex.ai")
LLAMA_PARSE_MODE = os.environ.get("LLAMA_PARSE_MODE", "parse_page")  # page-aligned markdown


def _llama_api_key() -> str:
    return os.environ.get("LLAMA_CLOUD_API_KEY", "")


def _clean_text(text: str) -> str:
    text = text.replace("\x00", "")
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def llama_parse_pdf(data: bytes, filename: str, timeout_seconds: int = 150):
    """Run LlamaParse and return a list of per-page markdown strings.

    Raises on any failure so callers can fall back to local parsing.
    """
    api_key = _llama_api_key()
    if not api_key:
        raise RuntimeError("LLAMA_CLOUD_API_KEY not configured")

    headers = {"Authorization": f"Bearer {api_key}"}

    with httpx.Client(timeout=60.0) as client:
        upload = client.post(
            f"{LLAMA_CLOUD_BASE}/api/parsing/upload",
            headers=headers,
            files={"file": (filename or "document.pdf", data, "application/pdf")},
            data={"parse_mode": LLAMA_PARSE_MODE},
        )
        upload.raise_for_status()
        job_id = upload.json().get("id")
        if not job_id:
            raise RuntimeError(f"LlamaParse upload returned no job id: {upload.text[:200]}")

        deadline = time.time() + timeout_seconds
        status = None
        while time.time() < deadline:
            poll = client.get(f"{LLAMA_CLOUD_BASE}/api/parsing/job/{job_id}", headers=headers)
            poll.raise_for_status()
            status = poll.json().get("status")
            if status in ("SUCCESS", "ERROR", "PARTIAL_SUCCESS"):
                break
            time.sleep(2)

        if status not in ("SUCCESS", "PARTIAL_SUCCESS"):
            raise RuntimeError(f"LlamaParse job {job_id} ended with status={status}")

        # Prefer structured per-page result so markdown stays page-aligned
        try:
            detail = client.get(
                f"{LLAMA_CLOUD_BASE}/api/parsing/job/{job_id}/result/json", headers=headers
            )
            if detail.status_code == 200:
                payload = detail.json()
                pages_md = [
                    (p.get("md") or p.get("markdown") or "").strip()
                    for p in payload.get("pages", [])
                ]
                if any(pages_md):
                    return pages_md
        except Exception:
            pass

        md = client.get(
            f"{LLAMA_CLOUD_BASE}/api/parsing/job/{job_id}/result/markdown", headers=headers
        )
        md.raise_for_status()
        return [md.text]


def _local_pdf_pages(pdf) -> list:
    """Local pypdfium2 extraction; returns list of (text, scanned_flag)."""
    out = []
    for i in range(len(pdf)):
        page = pdf[i]
        text = ""
        try:
            text_page = page.get_textpage()
            text = _clean_text(text_page.get_text_bounded()) or ""
            text_page.close()
        except Exception:
            text = ""
        out.append((text, len(text) < MIN_TEXT_CHARS))
        page.close()
    return out


@app.get("/api/pdf/health")
def health():
    return {"ok": True, "service": "python-parser", "engine": "pypdfium2"}


@app.post("/api/pdf/parse")
async def parse_pdf(request: Request):
    data = await request.body()
    if not data:
        return JSONResponse(status_code=400, content={"error": "Empty upload"})
    if not data[:5] == b"%PDF-":
        return JSONResponse(status_code=400, content={"error": "Not a PDF file"})

    try:
        pdf = pdfium.PdfDocument(io.BytesIO(data))
    except Exception as e:
        return JSONResponse(status_code=422, content={"error": f"Unreadable PDF: {e}"})

    try:
        page_count = len(pdf)
        filename = request.headers.get("x-file-name", "document.pdf")
        scanned_count = 0

        # Primary: LlamaParse (LlamaIndex cloud) — handles scans, tables, layouts
        llama_pages = None
        parser_used = "pypdfium2"
        if _llama_api_key():
            try:
                llama_pages = await _run_llama(llama_parse_pdf, data, filename)
                parser_used = "llamaparse"
            except Exception as e:
                print(f"[LlamaParse] failed, falling back to pypdfium2: {e}")

        if llama_pages:
            pages = []
            for i in range(page_count):
                md = llama_pages[i] if i < len(llama_pages) else ""
                pages.append(f"[PDF page {i + 1}]\n{md}" if md else f"[PDF page {i + 1}]")
                if len(md) < MIN_TEXT_CHARS:
                    scanned_count += 1
        else:
            local = _local_pdf_pages(pdf)
            pages = []
            for i, (text, scanned) in enumerate(local):
                if scanned:
                    scanned_count += 1
                pages.append(f"[PDF page {i + 1}]\n{text}" if text else f"[PDF page {i + 1}]")

        full_text = "\n\n".join(pages)
        return {
            "fileName": filename,
            "pageCount": page_count,
            "text": full_text,
            "charCount": len(full_text),
            "scannedPages": scanned_count,
            "isMostlyScanned": page_count > 0 and scanned_count > page_count / 2,
            "parser": parser_used,
        }
    finally:
        pdf.close()


async def _run_llama(fn, data: bytes, filename: str):
    """Run blocking LlamaParse calls off the event loop."""
    import anyio
    return await anyio.to_thread.run_sync(lambda: fn(data, filename))


@app.post("/api/pdf/page-image")
async def render_page_image(request: Request):
    """Render one page of an uploaded PDF to PNG for AI (Gemini vision) parsing."""
    data = await request.body()
    page_number = int(request.headers.get("x-page-number", "1"))
    scale = float(request.headers.get("x-render-scale", "2"))  # ~144 DPI

    if not data[:5] == b"%PDF-":
        return JSONResponse(status_code=400, content={"error": "Not a PDF file"})

    try:
        pdf = pdfium.PdfDocument(io.BytesIO(data))
    except Exception as e:
        return JSONResponse(status_code=422, content={"error": f"Unreadable PDF: {e}"})

    try:
        if page_number < 1 or page_number > len(pdf):
            return JSONResponse(status_code=400, content={"error": f"Page {page_number} out of range (1-{len(pdf)})"})
        page = pdf[page_number - 1]
        bitmap = page.render(scale=scale)
        pil_image = bitmap.to_pil()
        buf = io.BytesIO()
        pil_image.save(buf, format="PNG", optimize=True)
        return {
            "pageNumber": page_number,
            "mimeType": "image/png",
            "imageBase64": base64.b64encode(buf.getvalue()).decode("ascii"),
            "width": pil_image.width,
            "height": pil_image.height,
        }
    finally:
        pdf.close()


@app.post("/api/docx/parse")
async def parse_docx(request: Request):
    import zipfile
    from xml.etree import ElementTree as ET

    data = await request.body()
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
        doc_xml = zf.read("word/document.xml")
    except Exception as e:
        return JSONResponse(status_code=422, content={"error": f"Unreadable DOCX: {e}"})

    ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    root = ET.fromstring(doc_xml)
    lines = []
    for para in root.iter(f"{ns}p"):
        runs = [t.text or "" for t in para.iter(f"{ns}t")]
        joined = "".join(runs).strip()
        if joined:
            lines.append(joined)

    full_text = "\n\n".join(lines)
    return {
        "fileName": request.headers.get("x-file-name", "document.docx"),
        "pageCount": 1,  # DOCX has no intrinsic pagination; engine estimates later
        "text": full_text,
        "charCount": len(full_text),
        "parser": "python-docx-zip",
    }
