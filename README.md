# peasy-pdf

[![npm](https://img.shields.io/npm/v/peasy-pdf)](https://www.npmjs.com/package/peasy-pdf)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

PDF manipulation library for Node.js -- merge, split, rotate, reorder, extract pages, and manage metadata. TypeScript-first with full type safety, powered by [pdf-lib](https://pdf-lib.js.org/) for pure-JavaScript PDF processing with zero native dependencies.

Built from [Peasy PDF](https://peasypdf.com), the developer tools platform for PDF processing, conversion, and optimization.

> **Try the interactive tools at [peasypdf.com](https://peasypdf.com)** -- [Merge PDF](https://peasypdf.com/tools/merge-pdf/), [Split PDF](https://peasypdf.com/tools/split-pdf/), [Rotate PDF](https://peasypdf.com/tools/rotate-pdf/)

<p align="center">
  <img src="demo.gif" alt="peasy-pdf demo — PDF merge, split, extract text operations in terminal" width="800">
</p>

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [What You Can Do](#what-you-can-do)
  - [Merge and Split](#merge-and-split)
  - [Rotate and Reorder](#rotate-and-reorder)
  - [Page Management](#page-management)
  - [Metadata](#metadata)
- [TypeScript Types](#typescript-types)
- [API Reference](#api-reference)
- [Also Available for Python](#also-available-for-python)
- [Peasy Developer Tools](#peasy-developer-tools)
- [License](#license)

## Install

```bash
npm install peasy-pdf
```

## Quick Start

```typescript
import { merge, split, rotate, info, setMetadata } from "peasy-pdf";
import { readFileSync, writeFileSync } from "fs";

// Merge two PDFs into one
const pdf1 = readFileSync("report-q1.pdf");
const pdf2 = readFileSync("report-q2.pdf");
const merged = await merge(pdf1, pdf2);
writeFileSync("annual-report.pdf", merged);

// Split a PDF by page ranges
const parts = await split(readFileSync("document.pdf"), "1-3,4-6");
parts.forEach((part, i) => writeFileSync(`part-${i + 1}.pdf`, part));

// Rotate all pages 90 degrees clockwise
const rotated = await rotate(readFileSync("landscape.pdf"), 90);

// Get PDF information
const pdfInfo = await info(readFileSync("document.pdf"));
console.log(`Pages: ${pdfInfo.pages}, Title: ${pdfInfo.title}`);

// Set document metadata
const tagged = await setMetadata(readFileSync("draft.pdf"), {
  title: "Annual Report 2026",
  author: "Finance Team",
});
```

## What You Can Do

### Merge and Split

Combine multiple PDF documents into a single file, or split a large PDF into smaller parts by page ranges. The merge operation preserves all page content, annotations, and formatting from the source documents.

| Operation | Function | Description |
|-----------|----------|-------------|
| Merge | `merge(...sources)` | Combine multiple PDFs into one document |
| Split | `split(source, ranges)` | Split a PDF by page ranges (e.g. "1-3,4-6") |

```typescript
import { merge, split } from "peasy-pdf";

// Merge three reports into one combined document
const combined = await merge(q1Report, q2Report, q3Report);

// Split a 10-page document into three parts
const parts = await split(document, "1-3,4-7,8-10");
console.log(parts.length); // 3 separate PDF byte arrays
```

Learn more: [Merge PDF Tool](https://peasypdf.com/tools/merge-pdf/) -- [Split PDF Tool](https://peasypdf.com/tools/split-pdf/)

### Rotate and Reorder

Rotate pages by 90, 180, or 270 degrees, reverse page order, or extract odd/even pages. Rotation can target all pages or a specific subset using page specifications.

| Operation | Function | Description |
|-----------|----------|-------------|
| Rotate | `rotate(source, angle, pages?)` | Rotate pages by 90/180/270 degrees |
| Reverse | `reverse(source)` | Reverse the page order |
| Odd/Even | `oddEven(source, mode)` | Extract odd or even pages |

```typescript
import { rotate, reverse, oddEven } from "peasy-pdf";

// Rotate all pages 90 degrees clockwise
const rotated = await rotate(pdf, 90);

// Rotate only pages 1 and 3
const partial = await rotate(pdf, 180, "1,3");

// Reverse page order (last page becomes first)
const reversed = await reverse(pdf);

// Extract only odd pages (1, 3, 5...) for duplex printing
const oddPages = await oddEven(pdf, "odd");
```

Learn more: [Rotate PDF Tool](https://peasypdf.com/tools/rotate-pdf/)

### Page Management

Delete, extract, insert, or duplicate individual pages. All page specifications use 1-based page numbers and support ranges (e.g. "1-3,5,7-9") or the keyword "all".

| Operation | Function | Description |
|-----------|----------|-------------|
| Delete | `deletePages(source, pages)` | Remove specific pages |
| Extract | `extractPages(source, pages)` | Extract pages into a new PDF |
| Insert blank | `insertBlank(source, after?, options?)` | Insert blank pages |
| Duplicate | `duplicatePages(source, pages?, copies?)` | Duplicate pages in place |

```typescript
import { deletePages, extractPages, insertBlank, duplicatePages } from "peasy-pdf";

// Remove the cover page and table of contents
const trimmed = await deletePages(pdf, "1-2");

// Extract pages 5 through 10 into a new document
const excerpt = await extractPages(pdf, "5-10");

// Insert a blank separator page after page 3
const withSeparator = await insertBlank(pdf, "3");

// Insert 2 blank A4 pages at the end
const padded = await insertBlank(pdf, undefined, {
  count: 2,
  width: 595,   // A4 width in points
  height: 842,  // A4 height in points
});

// Duplicate every page (useful for printing 2-up)
const doubled = await duplicatePages(pdf);
```

Learn more: [PDF Page Tools](https://peasypdf.com/tools/)

### Metadata

Read, write, or strip PDF document metadata including title, author, subject, keywords, creator, and producer fields. The `info()` function provides a quick overview including page count and file size.

| Operation | Function | Description |
|-----------|----------|-------------|
| Info | `info(source)` | Page count, metadata, file size |
| Get | `getMetadata(source)` | Read all metadata fields |
| Set | `setMetadata(source, metadata)` | Update metadata fields |
| Strip | `stripMetadata(source)` | Remove all metadata |

```typescript
import { info, getMetadata, setMetadata, stripMetadata } from "peasy-pdf";

// Quick document overview
const pdfInfo = await info(pdf);
console.log(`${pdfInfo.pages} pages, ${pdfInfo.sizeBytes} bytes`);
console.log(`Title: ${pdfInfo.title}, Author: ${pdfInfo.author}`);

// Set metadata before publishing
const published = await setMetadata(pdf, {
  title: "Q1 Financial Report",
  author: "Finance Department",
  subject: "Quarterly financials",
  keywords: "finance, quarterly, 2026",
});

// Strip all metadata for privacy
const clean = await stripMetadata(pdf);
```

Learn more: [PDF Metadata Tool](https://peasypdf.com/tools/pdf-metadata/)

## TypeScript Types

```typescript
import type { PdfInfo, PdfMetadata, PageSize, OddEvenMode } from "peasy-pdf";

// PdfInfo -- document overview from info()
const pdfInfo: PdfInfo = {
  pages: 10,
  title: "Annual Report",
  author: "Finance Team",
  subject: "2026 Financials",
  creator: "peasy-pdf",
  producer: "pdf-lib",
  sizeBytes: 245_760,
};

// PdfMetadata -- fields for get/set metadata
const metadata: PdfMetadata = {
  title: "My Document",
  author: "John Doe",
  subject: "Testing",
  keywords: "test, pdf",
};

// OddEvenMode -- "odd" | "even" for page extraction
const mode: OddEvenMode = "odd";

// PageSize -- standard page sizes (planned for future use)
const size: PageSize = "a4";
```

## API Reference

| Function | Description |
|----------|-------------|
| `merge(...sources)` | Merge multiple PDFs into one |
| `split(source, ranges)` | Split PDF by comma-separated page ranges |
| `rotate(source, angle, pages?)` | Rotate pages by 90/180/270 degrees |
| `reverse(source)` | Reverse page order |
| `deletePages(source, pages)` | Remove specified pages |
| `extractPages(source, pages)` | Extract pages into new PDF |
| `oddEven(source, mode)` | Extract odd or even pages |
| `insertBlank(source, after?, options?)` | Insert blank pages |
| `duplicatePages(source, pages?, copies?)` | Duplicate pages in place |
| `info(source)` | Get page count, metadata, file size |
| `getMetadata(source)` | Read document metadata |
| `setMetadata(source, metadata)` | Set document metadata |
| `stripMetadata(source)` | Remove all metadata |
| `parsePages(spec, total)` | Parse page specification to 0-based indices |

All functions accept `Uint8Array` (PDF bytes) and return `Promise<Uint8Array>` or structured data. No filesystem access -- works in Node.js and browsers.

## Also Available for Python

```bash
pip install peasy-pdf
```

The Python package provides PDF merge, split, rotate, compress, extract text, encrypt/decrypt, and 14 more operations with CLI, MCP server, and REST API client. See [peasy-pdf on PyPI](https://pypi.org/project/peasy-pdf/).

## Peasy Developer Tools

| Package | PyPI | npm | Description |
|---------|------|-----|-------------|
| peasytext | [PyPI](https://pypi.org/project/peasytext/) | [npm](https://www.npmjs.com/package/peasytext) | Text analysis -- readability, sentiment, keywords |
| **peasy-pdf** | [PyPI](https://pypi.org/project/peasy-pdf/) | **[npm](https://www.npmjs.com/package/peasy-pdf)** | **PDF processing -- merge, split, rotate, metadata** |
| peasy-image | [PyPI](https://pypi.org/project/peasy-image/) | -- | Image ops -- resize, crop, filter, watermark |
| peasy-css | [PyPI](https://pypi.org/project/peasy-css/) | [npm](https://www.npmjs.com/package/peasy-css) | CSS generation -- gradients, shadows, flexbox, grid |
| peasy-compress | [PyPI](https://pypi.org/project/peasy-compress/) | [npm](https://www.npmjs.com/package/peasy-compress) | Archive & compression -- ZIP, gzip, brotli, deflate |
| peasy-document | [PyPI](https://pypi.org/project/peasy-document/) | [npm](https://www.npmjs.com/package/peasy-document) | Document conversion -- DOCX, HTML, Markdown |

Part of the [Peasy](https://peasytools.com) developer tools ecosystem.

## License

MIT
