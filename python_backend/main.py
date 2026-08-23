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

# Load repo-root .env (service runs from python_backend/)
for _env_path in (os.path.join(os.path.dirname(__file__), "..", ".env"), os.path.join(os.getcwd(), ".env")):
    try:
        with open(_env_path) as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _, _v = _line.partition("=")
                    os.environ.setdefault(_k.strip().strip('"'), _v.strip().strip('"'))
    except FileNotFoundError:
        pass

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
LLAMA_PARSE_TIER = os.environ.get("LLAMA_PARSE_TIER", "agentic")


def _llama_api_key() -> str:
    return os.environ.get("LLAMA_CLOUD_API_KEY", "")


def _new_llama_client(timeout_seconds: int = 240):
    from llama_cloud import LlamaCloud
    return LlamaCloud(
        api_key=_llama_api_key(),
        base_url=LLAMA_CLOUD_BASE,
        timeout=timeout_seconds,
    )


def _clean_text(text: str) -> str:
    text = text.replace("\x00", "")
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def split_pdf_single_pages(data: bytes) -> list:
    """Split a PDF into single-page PDF bytes, preserving page order."""
    src = pdfium.PdfDocument(io.BytesIO(data))
    try:
        single_page_pdfs = []
        for i in range(len(src)):
            dst = pdfium.PdfDocument.new()
            dst.import_pages(src, pages=[i])
            buf = io.BytesIO()
            dst.save(buf)
            dst.close()
            single_page_pdfs.append(buf.getvalue())
        return single_page_pdfs
    finally:
        src.close()


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


LLAMA_CONCURRENCY = int(os.environ.get("LLAMA_CONCURRENCY", "5"))


def _llama_parse_one(client, page_bytes: bytes, filename: str, retries: int = 2) -> str:
    """Parse one single-page PDF via LlamaParse with retry on failure."""
    last_err = None
    for attempt in range(retries + 1):
        try:
            result = client.parsing.parse(
                upload_file=(filename, page_bytes, "application/pdf"),
                tier=LLAMA_PARSE_TIER,
                version="latest",
                expand=["markdown"],
            )
            md_obj = getattr(result, "markdown", None)
            pages = getattr(md_obj, "pages", None) if md_obj is not None else None
            if pages:
                md = (getattr(pages[0], "markdown", None) or getattr(pages[0], "md", "") or "")
                return md.strip()
            full = (getattr(md_obj, "markdown", None) or "") if md_obj is not None else ""
            return (full or "").strip()
        except Exception as e:  # transient API failures — retry then give up
            last_err = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"LlamaParse page parse failed after {retries + 1} attempts: {last_err}")


@app.get("/api/pdf/health")
def health():
    return {"ok": True, "service": "python-parser", "engine": "pypdfium2"}


# ---------------------------------------------------------------------------
# Page-level Markdown cache: one .md file per page in a per-document folder.
# Retrying a document skips every cached page to save LlamaParse credits;
# once all pages are cached they are stitched into a single final .md file.
# ---------------------------------------------------------------------------
CACHE_ROOT = os.environ.get(
    "PAGE_CACHE_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), ".page_cache"),
)


def _file_hash(data: bytes) -> str:
    import hashlib
    return hashlib.sha256(data).hexdigest()[:16]


def _cache_dir(file_hash: str) -> str:
    path = os.path.join(CACHE_ROOT, file_hash)
    os.makedirs(path, exist_ok=True)
    return path


def _page_cache_path(cache: str, page: int) -> str:
    return os.path.join(cache, f"page-{page}.md")


def _read_cached_pages(cache: str, page_count: int) -> list:
    """Return markdown per page (empty string if not cached)."""
    pages = []
    for i in range(1, page_count + 1):
        md = ""
        try:
            with open(_page_cache_path(cache, i), encoding="utf-8") as f:
                md = f.read().strip()
        except FileNotFoundError:
            pass
        pages.append(md)
    return pages


def _stitch_final_md(cache: str, filename: str, page_markdowns: list) -> str:
    """Stitch all per-page .md files into final.md and return it."""
    parts = [
        "---",
        f'source_file: "{filename}"',
        f"total_pages: {len(page_markdowns)}",
        f'stitched_at: "{time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}"',
        "---",
        "",
    ]
    for i, md in enumerate(page_markdowns, start=1):
        parts.append(f"# Page {i}")
        parts.append("")
        parts.append(md if md else "[No content extracted for this page]")
        parts.append("")
    stitched = "\n".join(parts).strip() + "\n"
    with open(os.path.join(cache, "final.md"), "w", encoding="utf-8") as f:
        f.write(stitched)
    return stitched


def parse_pdf_with_page_cache(data: bytes, filename: str, page_count: int):
    """Parse using the per-page cache. Returns (pages, cached_count, parsed_count).

    - Skips any page already present in the cache (credit saving on retries)
    - Parses only missing pages via LlamaParse (5 concurrent calls)
    - Writes each result as page-N.md
    - When every page is cached, stitches them into final.md
    """
    cache = _cache_dir(_file_hash(data))
    cached = _read_cached_pages(cache, page_count)
    # A page counts as cached when its .md file exists on disk (even if the
    # extracted markdown is empty for a blank/scanned page)
    cached_count = sum(1 for i in range(page_count) if os.path.exists(_page_cache_path(cache, i + 1)))

    # Fast path: fully cached document — zero API calls
    if all(os.path.exists(_page_cache_path(cache, i + 1)) for i in range(page_count)):
        return cached, cached_count, 0

    # Parse only the missing pages, 5 concurrent LlamaParse calls
    missing = [i for i in range(page_count) if not os.path.exists(_page_cache_path(cache, i + 1))]
    api_key = _llama_api_key()
    if not api_key:
        raise RuntimeError("LLAMA_CLOUD_API_KEY not configured")

    from llama_cloud import LlamaCloud

    client = LlamaCloud(api_key=api_key, base_url=LLAMA_CLOUD_BASE, timeout=240)
    page_pdfs = split_pdf_single_pages(data)

    results = {}
    errors = {}

    def work(idx: int):
        try:
            results[idx] = _llama_parse_one(client, page_pdfs[idx], f"page-{idx + 1}.pdf")
        except Exception as e:
            errors[idx] = e

    from concurrent.futures import ThreadPoolExecutor

    with ThreadPoolExecutor(max_workers=max(1, LLAMA_CONCURRENCY)) as pool:
        list(pool.map(work, missing))

    # Persist successful pages; failed pages stay uncached so a retry re-parses only those
    for idx, md in results.items():
        with open(_page_cache_path(cache, idx + 1), "w", encoding="utf-8") as f:
            f.write(md)

    if len(errors) == len(missing):
        raise RuntimeError(
            f"All {len(errors)} LlamaParse page calls failed; first error: {list(errors.values())[0]}"
        )

    pages = _read_cached_pages(cache, page_count)
    newly_parsed = sum(1 for idx in results if results[idx])
    return pages, cached_count, newly_parsed


@app.post("/api/pdf/inspect")
async def inspect_pdf(request: Request):
    """Fast local inspection only — no LlamaParse calls, no credits used.

    Returns the exact page count and scanned-page estimate so Stage 2 can
    show the correct LED grid before any parsing starts.
    """
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
        scanned_count = 0
        for text, scanned in _local_pdf_pages(pdf):
            if scanned:
                scanned_count += 1
        file_hash = _file_hash(data)
        cache = _cache_dir(file_hash)
        cached_pages = sum(
            1 for i in range(1, page_count + 1) if os.path.exists(_page_cache_path(cache, i))
        )
        return {
            "fileName": request.headers.get("x-file-name", "document.pdf"),
            "pageCount": page_count,
            "scannedPages": scanned_count,
            "isMostlyScanned": page_count > 0 and scanned_count > page_count / 2,
            "fileHash": file_hash,
            "cachedPages": cached_pages,
            "allCached": page_count > 0 and cached_pages == page_count,
        }
    finally:
        pdf.close()


@app.post("/api/pdf/page-parse")
async def parse_single_page_pdf(request: Request):
    """Parse ONE page of an uploaded PDF via LlamaParse (Stage 2 LED flow).

    - Cache hit: returns the cached page-N.md instantly, zero API calls
    - Cache miss: splits out that single page, makes exactly one LlamaParse
      call, saves page-N.md
    - When the last page lands, stitches every page .md into final.md
    """
    data = await request.body()
    if not data:
        return JSONResponse(status_code=400, content={"error": "Empty upload"})
    if not data[:5] == b"%PDF-":
        return JSONResponse(status_code=400, content={"error": "Not a PDF file"})

    page_number = int(request.headers.get("x-page-number", "1"))
    filename = request.headers.get("x-file-name", "document.pdf")

    try:
        pdf = pdfium.PdfDocument(io.BytesIO(data))
    except Exception as e:
        return JSONResponse(status_code=422, content={"error": f"Unreadable PDF: {e}"})

    try:
        page_count = len(pdf)
        if page_number < 1 or page_number > page_count:
            return JSONResponse(status_code=400, content={"error": f"Page {page_number} out of range (1-{page_count})"})

        cache = _cache_dir(_file_hash(data))
        page_path = _page_cache_path(cache, page_number)

        cached = os.path.exists(page_path)
        if not cached:
            try:
                page_pdfs = await _run_llama(split_pdf_single_pages, data)
                client = _new_llama_client()
                md = await _run_llama(_llama_parse_one, client, page_pdfs[page_number - 1], f"page-{page_number}.pdf")
            except Exception as e:
                print(f"[LlamaParse] page {page_number} failed: {e}")
                return JSONResponse(status_code=502, content={"error": f"LlamaParse page parse failed: {e}"})
            with open(page_path, "w", encoding="utf-8") as f:
                f.write(md)

        with open(page_path, encoding="utf-8") as f:
            markdown = f.read()

        cached_pages = sum(
            1 for i in range(1, page_count + 1) if os.path.exists(_page_cache_path(cache, i))
        )
        all_present = cached_pages == page_count
        stitched = os.path.exists(os.path.join(cache, "final.md"))
        if all_present and not stitched:
            pages_md = _read_cached_pages(cache, page_count)
            await _run_llama(_stitch_final_md, cache, filename, pages_md)
            stitched = True

        return {
            "fileName": filename,
            "page": page_number,
            "pageCount": page_count,
            "markdown": markdown,
            "cached": cached,
            "cachedPages": cached_pages,
            "allPagesDone": all_present,
            "stitched": stitched,
        }
    finally:
        pdf.close()


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

        # Primary: LlamaParse (LlamaIndex cloud), one API call per page with
        # LLAMA_CONCURRENCY parallel calls — handles scans, tables, layouts.
        # Pages are cached individually; retries skip cached pages.
        llama_pages = None
        parser_used = "pypdfium2"
        meta_extra = {}
        if _llama_api_key():
            try:
                llama_pages, cached_count, parsed_count = await _run_llama(
                    parse_pdf_with_page_cache, data, filename, page_count
                )
                parser_used = "llamaparse"
                meta_extra = {
                    "cachedPages": cached_count,
                    "parsedPages": parsed_count,
                }
            except Exception as e:
                print(f"[LlamaParse] failed, falling back to pypdfium2: {e}")

        if llama_pages is not None:
            pages = []
            for i in range(page_count):
                md = llama_pages[i] if i < len(llama_pages) else ""
                pages.append(f"[PDF page {i + 1}]\n{md}" if md else f"[PDF page {i + 1}]")
                if len(md) < MIN_TEXT_CHARS:
                    scanned_count += 1

            # Stitch final.md when every page has been successfully responded
            file_hash = _file_hash(data)
            cache = _cache_dir(file_hash)
            all_present = all(os.path.exists(_page_cache_path(cache, i + 1)) for i in range(page_count))
            stitched_path = os.path.join(cache, "final.md")
            if all_present and not os.path.exists(stitched_path):
                await _run_llama(_stitch_final_md, cache, filename, llama_pages)
            meta_extra["stitched"] = os.path.exists(stitched_path)
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
            **meta_extra,
        }
    finally:
        pdf.close()


async def _run_llama(fn, *args):
    """Run blocking LlamaParse calls off the event loop."""
    import anyio
    return await anyio.to_thread.run_sync(lambda: fn(*args))


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
