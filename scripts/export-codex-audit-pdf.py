#!/usr/bin/env python3
"""Export the verified single-source AutonoService Codex report to an accessible GitHub PDF."""
from pathlib import Path
import html
import re

import mistune
from weasyprint import HTML
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
source = root / "docs/AUTONOSERVICE_INFORME_UNICO_CODEX_2026-10-30.md"
output = root / "docs/AUTONOSERVICE_INFORME_UNICO_CODEX_2026-10-30.pdf"
text = source.read_text(encoding="utf-8")
if len(text) < 60000:
    raise RuntimeError("The report Markdown is incomplete.")

markdown = mistune.create_markdown(escape=True, plugins=["table", "strikethrough", "url", "task_lists"])
body = markdown(text)
css = r"""
@page {
  size: A4;
  margin: 19mm 16mm 18mm 16mm;
  @bottom-right {
    content: "Página " counter(page);
    font-family: "DejaVu Sans", sans-serif;
    font-size: 8pt; color: #596b62;
  }
}
html, body {
  font-family: "DejaVu Sans", "Liberation Sans", sans-serif;
  font-size: 9pt; color: #23352e;
  line-height: 1.52;
}
h1, h2, h3, h4 { color: #172921; line-height: 1.24; break-after: avoid; }
h1 { font-size: 19pt; margin: 13mm 0 5mm; padding-bottom: 3mm; border-bottom: 2px solid #c7a075; }
h2 { font-size: 14pt; margin: 8mm 0 3mm; }
h3 { font-size: 11pt; margin: 5mm 0 2mm; }
p { margin: 0 0 3.5mm; orphans: 3; widows: 3; }
ul, ol { margin: 2mm 0 3mm; padding-left: 6mm; }
li { margin-bottom: 1.5mm; }
li p { margin-bottom: 1mm; }
a { color: #246657; text-decoration: underline; }
hr { border: none; height: 1px; background: #c9d4cf; margin: 6mm 0; }
blockquote {
  margin: 3mm 0; padding: 2.5mm 4mm;
  background: #f1f4f1; border-left: 3px solid #c7a075;
}
table { width: 100%; border-collapse: collapse; font-size: 7.8pt; margin: 4mm 0 6mm; table-layout: fixed; }
th, td { border: 1px solid #d9dfdb; padding: 1.8mm 2mm; vertical-align: top; overflow-wrap: anywhere; }
th { background: #e8eee9; font-weight: bold; }
tr { break-inside: avoid; }
code { font-family: "DejaVu Sans Mono", monospace; background: #f1f4f1; font-size: 0.91em; overflow-wrap: anywhere; }
pre { white-space: pre-wrap; font-size: 7.6pt; border: 1px solid #d8dfdb; padding: 3mm; background: #f7f8f7; }
pre code { background: none; }
strong { color: #172921; }
"""
full = "<!doctype html><html lang='es'><head><meta charset='UTF-8'>" + \
    "<title>AutonoService - Informe único para Codex</title><style>" + css + \
    "</style></head><body>" + body + "</body></html>"
HTML(string=full, base_url=str(root)).write_pdf(str(output), metadata={
    "title": "AutonoService - Informe único completo para Codex",
    "author": "Auditoría técnica de AutonoService",
})
r = PdfReader(str(output))
if len(r.pages) < 25 or len(r.pages) > 300:
    raise RuntimeError(f"Unexpected PDF page count: {len(r.pages)}")
contents = "".join(page.extract_text() or "" for page in r.pages)
for term in ("382", "158", "Codex", "Supabase", "RedMoonCorp", "RedMoonStudios"):
    if term not in contents:
        raise RuntimeError(f"Missing expected audit topic: {term}")
if len(contents) < 50000:
    raise RuntimeError("PDF appears truncated.")
print(f"PDF validated: {output}, pages={len(r.pages)}, bytes={output.stat().st_size}, text_chars={len(contents)}")
