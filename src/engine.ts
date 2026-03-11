/**
 * peasy-pdf — PDF manipulation engine powered by pdf-lib.
 *
 * All functions accept Uint8Array (PDF bytes) and return Uint8Array or
 * structured data. No filesystem access — works in Node.js and browsers.
 */

import { PDFDocument, degrees } from "pdf-lib";
import type { PdfInfo, PdfMetadata, OddEvenMode } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a page specification string into zero-based page indices.
 *
 * Supported formats:
 *   - "all"        — every page
 *   - "1,3,5"      — specific pages (1-based)
 *   - "1-3,7-9"    — ranges (inclusive, 1-based)
 *   - "2-4,6"      — mixed ranges and singles
 *
 * Out-of-range values are clamped to [1, total].
 */
export function parsePages(spec: string, total: number): number[] {
  if (spec.trim().toLowerCase() === "all") {
    return Array.from({ length: total }, (_, i) => i);
  }

  const indices: number[] = [];

  for (const part of spec.split(",")) {
    const trimmed = part.trim();
    if (trimmed === "") continue;

    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-", 2);
      const start = Math.max(1, parseInt(startStr!, 10));
      const end = Math.min(total, parseInt(endStr!, 10));
      for (let i = start - 1; i < end; i++) {
        indices.push(i);
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (page >= 1 && page <= total) {
        indices.push(page - 1);
      }
    }
  }

  return indices;
}

// ---------------------------------------------------------------------------
// Merge & Split
// ---------------------------------------------------------------------------

/**
 * Merge multiple PDF documents into a single PDF.
 *
 * @param sources - Two or more PDF byte arrays to merge in order.
 * @returns The merged PDF as a Uint8Array.
 */
export async function merge(...sources: Uint8Array[]): Promise<Uint8Array> {
  if (sources.length === 0) {
    throw new Error("merge requires at least one PDF");
  }

  const merged = await PDFDocument.create();

  for (const src of sources) {
    const doc = await PDFDocument.load(src);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }

  return merged.save();
}

/**
 * Split a PDF into multiple PDFs by page ranges.
 *
 * @param source - The source PDF bytes.
 * @param ranges - Comma-separated page ranges, e.g. "1-3,4-6,7".
 *                 Each range becomes a separate output PDF.
 * @returns An array of PDF byte arrays, one per range group.
 */
export async function split(
  source: Uint8Array,
  ranges: string,
): Promise<Uint8Array[]> {
  const srcDoc = await PDFDocument.load(source);
  const total = srcDoc.getPageCount();
  const rangeGroups = ranges.split(",").reduce<string[][]>(
    (groups, part) => {
      const trimmed = part.trim();
      if (trimmed === "") return groups;
      // Group consecutive range parts: "1-3" is one group, "4-6" is another
      // A single entry like "1-3,4-6" produces two groups
      groups.push([trimmed]);
      return groups;
    },
    [],
  );

  // Re-parse: treat the original ranges string as groups separated by semicolons
  // or each comma-separated segment as its own output PDF
  const results: Uint8Array[] = [];

  for (const group of rangeGroups) {
    const spec = group.join(",");
    const indices = parsePages(spec, total);
    if (indices.length === 0) continue;

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    copiedPages.forEach((p) => newDoc.addPage(p));
    results.push(await newDoc.save());
  }

  return results;
}

// ---------------------------------------------------------------------------
// Rotate & Reorder
// ---------------------------------------------------------------------------

/**
 * Rotate pages by the given angle (90, 180, or 270 degrees clockwise).
 *
 * @param source - The source PDF bytes.
 * @param angle  - Rotation angle in degrees (90, 180, 270).
 * @param pages  - Optional page spec (default: "all").
 * @returns The PDF with rotated pages.
 */
export async function rotate(
  source: Uint8Array,
  angle: number,
  pages?: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(source);
  const indices = parsePages(pages || "all", doc.getPageCount());

  for (const idx of indices) {
    const page = doc.getPage(idx);
    const current = page.getRotation().angle;
    page.setRotation(degrees(current + angle));
  }

  return doc.save();
}

/**
 * Reverse the page order of a PDF.
 *
 * @param source - The source PDF bytes.
 * @returns The PDF with pages in reverse order.
 */
export async function reverse(source: Uint8Array): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(source);
  const total = srcDoc.getPageCount();
  const reversed = await PDFDocument.create();

  const indices = Array.from({ length: total }, (_, i) => total - 1 - i);
  const pages = await reversed.copyPages(srcDoc, indices);
  pages.forEach((p) => reversed.addPage(p));

  return reversed.save();
}

// ---------------------------------------------------------------------------
// Page Management
// ---------------------------------------------------------------------------

/**
 * Delete specified pages from a PDF.
 *
 * @param source - The source PDF bytes.
 * @param pages  - Page spec of pages to remove (e.g. "1,3,5-7").
 * @returns The PDF with specified pages removed.
 */
export async function deletePages(
  source: Uint8Array,
  pages: string,
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(source);
  const total = srcDoc.getPageCount();
  const toDelete = new Set(parsePages(pages, total));

  const keepIndices = Array.from({ length: total }, (_, i) => i).filter(
    (i) => !toDelete.has(i),
  );

  if (keepIndices.length === 0) {
    throw new Error("Cannot delete all pages from a PDF");
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, keepIndices);
  copiedPages.forEach((p) => newDoc.addPage(p));

  return newDoc.save();
}

/**
 * Extract specified pages from a PDF into a new PDF.
 *
 * @param source - The source PDF bytes.
 * @param pages  - Page spec of pages to extract (e.g. "1-3,5").
 * @returns A new PDF containing only the specified pages.
 */
export async function extractPages(
  source: Uint8Array,
  pages: string,
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(source);
  const indices = parsePages(pages, srcDoc.getPageCount());

  if (indices.length === 0) {
    throw new Error("No pages to extract");
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, indices);
  copiedPages.forEach((p) => newDoc.addPage(p));

  return newDoc.save();
}

/**
 * Extract odd or even pages from a PDF.
 *
 * @param source - The source PDF bytes.
 * @param mode   - "odd" for pages 1, 3, 5... or "even" for pages 2, 4, 6...
 * @returns A new PDF containing only the selected pages.
 */
export async function oddEven(
  source: Uint8Array,
  mode: OddEvenMode,
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(source);
  const total = srcDoc.getPageCount();

  // Pages are 1-based for the user, 0-based internally
  const indices: number[] = [];
  for (let i = 0; i < total; i++) {
    const pageNum = i + 1; // 1-based
    if (mode === "odd" && pageNum % 2 === 1) indices.push(i);
    if (mode === "even" && pageNum % 2 === 0) indices.push(i);
  }

  if (indices.length === 0) {
    throw new Error(`No ${mode} pages found`);
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, indices);
  copiedPages.forEach((p) => newDoc.addPage(p));

  return newDoc.save();
}

/**
 * Insert blank pages into a PDF.
 *
 * @param source  - The source PDF bytes.
 * @param after   - Page spec for insertion point (e.g. "2" inserts after page 2).
 *                  If omitted, blank pages are appended at the end.
 * @param options - Optional: count (default 1), width/height in points.
 * @returns The PDF with blank pages inserted.
 */
export async function insertBlank(
  source: Uint8Array,
  after?: string,
  options?: { count?: number; width?: number; height?: number },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(source);
  const total = doc.getPageCount();
  const count = options?.count ?? 1;
  const width = options?.width ?? 612; // Letter width
  const height = options?.height ?? 792; // Letter height

  if (after === undefined || after === null) {
    // Append at the end
    for (let i = 0; i < count; i++) {
      doc.addPage([width, height]);
    }
  } else {
    const indices = parsePages(after, total);
    if (indices.length === 0) {
      throw new Error("Invalid page specification for insertion point");
    }
    // Insert after the last specified page
    const insertAfter = Math.max(...indices);
    for (let i = 0; i < count; i++) {
      doc.insertPage(insertAfter + 1 + i, [width, height]);
    }
  }

  return doc.save();
}

/**
 * Duplicate pages within a PDF.
 *
 * @param source - The source PDF bytes.
 * @param pages  - Page spec of pages to duplicate (default: "all").
 * @param copies - Number of copies of each page (default: 1, meaning 2 total).
 * @returns The PDF with duplicated pages.
 */
export async function duplicatePages(
  source: Uint8Array,
  pages?: string,
  copies?: number,
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(source);
  const total = srcDoc.getPageCount();
  const indices = parsePages(pages || "all", total);
  const numCopies = copies ?? 1;

  const newDoc = await PDFDocument.create();

  for (let i = 0; i < total; i++) {
    // Copy the original page
    const [page] = await newDoc.copyPages(srcDoc, [i]);
    newDoc.addPage(page!);

    // If this page should be duplicated, add copies
    if (indices.includes(i)) {
      for (let c = 0; c < numCopies; c++) {
        const [copy] = await newDoc.copyPages(srcDoc, [i]);
        newDoc.addPage(copy!);
      }
    }
  }

  return newDoc.save();
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

/**
 * Get information about a PDF document.
 *
 * @param source - The PDF bytes.
 * @returns PDF info including page count, metadata, and file size.
 */
export async function info(source: Uint8Array): Promise<PdfInfo> {
  const doc = await PDFDocument.load(source);

  return {
    pages: doc.getPageCount(),
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
    sizeBytes: source.byteLength,
  };
}

/**
 * Get document metadata from a PDF.
 *
 * @param source - The PDF bytes.
 * @returns The document metadata fields.
 */
export async function getMetadata(source: Uint8Array): Promise<PdfMetadata> {
  const doc = await PDFDocument.load(source);

  return {
    title: doc.getTitle() ?? undefined,
    author: doc.getAuthor() ?? undefined,
    subject: doc.getSubject() ?? undefined,
    keywords: doc.getKeywords() ?? undefined,
    creator: doc.getCreator() ?? undefined,
    producer: doc.getProducer() ?? undefined,
  };
}

/**
 * Set document metadata on a PDF.
 *
 * @param source   - The PDF bytes.
 * @param metadata - Metadata fields to set. Only provided fields are updated.
 * @returns The PDF with updated metadata.
 */
export async function setMetadata(
  source: Uint8Array,
  metadata: PdfMetadata,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(source);

  if (metadata.title !== undefined) doc.setTitle(metadata.title);
  if (metadata.author !== undefined) doc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) doc.setSubject(metadata.subject);
  if (metadata.keywords !== undefined)
    doc.setKeywords([metadata.keywords]);
  if (metadata.creator !== undefined) doc.setCreator(metadata.creator);
  if (metadata.producer !== undefined) doc.setProducer(metadata.producer);

  return doc.save();
}

/**
 * Remove all metadata from a PDF.
 *
 * @param source - The PDF bytes.
 * @returns The PDF with all metadata fields cleared.
 */
export async function stripMetadata(source: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(source);

  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("");

  return doc.save();
}
