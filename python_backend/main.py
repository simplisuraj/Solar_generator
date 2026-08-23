"""
Credit Appraisal Studio — Python document parsing service.

Replaces the unreliable client-side PDF byte-scanning with real structural
parsing (pypdfium2): exact page counts, per-page text extraction, and
scanned-page detection. The React UI and the existing /api/gemini/* flow
are untouched; Express proxies /api/pdf/* to this service.
"""
import io
import re

import base64

import pypdfium2 as pdfium
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import JSONResponse

app = FastAPI(title="CAS Parser Service")

# Pages whose extracted text is below this density are flagged as scanned
SCANNED_CHARS_PER_KB = 20
MIN_TEXT_CHARS = 20


def _clean_text(text: str) -> str:
    text = text.replace("\x00", "")
    return re.sub(r"\n{3,}", "\n\n", text).strip()


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
        pages = []
        scanned_count = 0

        for i in range(page_count):
            page = pdf[i]
            page_info = {"page": i + 1, "chars": 0, "scanned": False}
            try:
                text_page = page.get_textpage()
                text = _clean_text(text_page.get_text_bounded()) or ""
                text_page.close()
            except Exception:
                text = ""

            page_info["chars"] = len(text)
            if len(text) < MIN_TEXT_CHARS:
                page_info["scanned"] = True
                scanned_count += 1

            # Tag each page so downstream chunking stays page-aligned
            if text:
                pages.append(f"[PDF page {i + 1}]\n{text}")
            else:
                pages.append(f"[PDF page {i + 1}]")
            page.close()

        full_text = "\n\n".join(pages)
        return {
            "fileName": request.headers.get("x-file-name", "document.pdf"),
            "pageCount": page_count,
            "text": full_text,
            "charCount": len(full_text),
            "scannedPages": scanned_count,
            "isMostlyScanned": page_count > 0 and scanned_count > page_count / 2,
            "parser": "pypdfium2",
        }
    finally:
        pdf.close()


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
