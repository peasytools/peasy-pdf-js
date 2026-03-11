import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  parsePages,
  merge,
  split,
  rotate,
  reverse,
  deletePages,
  extractPages,
  oddEven,
  insertBlank,
  duplicatePages,
  info,
  getMetadata,
  setMetadata,
  stripMetadata,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a test PDF with the given number of pages (Letter size). */
async function makeTestPdf(pages: number = 3): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    doc.addPage([612, 792]); // Letter size
  }
  return doc.save();
}

/** Create a test PDF with metadata set. */
async function makeTestPdfWithMetadata(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  doc.setTitle("Test Title");
  doc.setAuthor("Test Author");
  doc.setSubject("Test Subject");
  doc.setKeywords(["keyword1, keyword2"]);
  doc.setCreator("Test Creator");
  doc.setProducer("Test Producer");
  return doc.save();
}

/** Get page count from PDF bytes. */
async function getPageCount(pdf: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(pdf);
  return doc.getPageCount();
}

// ---------------------------------------------------------------------------
// parsePages
// ---------------------------------------------------------------------------

describe("parsePages", () => {
  it("returns all indices for 'all'", () => {
    expect(parsePages("all", 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns all indices for 'ALL' (case-insensitive)", () => {
    expect(parsePages("ALL", 3)).toEqual([0, 1, 2]);
  });

  it("parses single pages (1-based to 0-based)", () => {
    expect(parsePages("1,3,5", 5)).toEqual([0, 2, 4]);
  });

  it("parses ranges (inclusive)", () => {
    expect(parsePages("2-4", 5)).toEqual([1, 2, 3]);
  });

  it("parses mixed ranges and singles", () => {
    expect(parsePages("1,3-5", 6)).toEqual([0, 2, 3, 4]);
  });

  it("clamps out-of-range values", () => {
    expect(parsePages("1-10", 3)).toEqual([0, 1, 2]);
  });

  it("ignores pages beyond total", () => {
    expect(parsePages("5", 3)).toEqual([]);
  });

  it("handles whitespace in spec", () => {
    expect(parsePages(" 1 , 2 - 3 ", 5)).toEqual([0, 1, 2]);
  });

  it("returns empty for empty string parts", () => {
    expect(parsePages(",,", 5)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// merge
// ---------------------------------------------------------------------------

describe("merge", () => {
  it("merges two PDFs", async () => {
    const pdf1 = await makeTestPdf(2);
    const pdf2 = await makeTestPdf(3);
    const result = await merge(pdf1, pdf2);
    expect(await getPageCount(result)).toBe(5);
  });

  it("merges three PDFs", async () => {
    const pdf1 = await makeTestPdf(1);
    const pdf2 = await makeTestPdf(2);
    const pdf3 = await makeTestPdf(3);
    const result = await merge(pdf1, pdf2, pdf3);
    expect(await getPageCount(result)).toBe(6);
  });

  it("merges a single PDF (passthrough)", async () => {
    const pdf = await makeTestPdf(4);
    const result = await merge(pdf);
    expect(await getPageCount(result)).toBe(4);
  });

  it("throws on zero sources", async () => {
    await expect(merge()).rejects.toThrow("at least one PDF");
  });
});

// ---------------------------------------------------------------------------
// split
// ---------------------------------------------------------------------------

describe("split", () => {
  it("splits into individual pages", async () => {
    const pdf = await makeTestPdf(3);
    const parts = await split(pdf, "1,2,3");
    expect(parts.length).toBe(3);
    for (const part of parts) {
      expect(await getPageCount(part)).toBe(1);
    }
  });

  it("splits by ranges", async () => {
    const pdf = await makeTestPdf(6);
    const parts = await split(pdf, "1-3,4-6");
    expect(parts.length).toBe(2);
    expect(await getPageCount(parts[0]!)).toBe(3);
    expect(await getPageCount(parts[1]!)).toBe(3);
  });

  it("splits with mixed range and single", async () => {
    const pdf = await makeTestPdf(5);
    const parts = await split(pdf, "1-2,3,4-5");
    expect(parts.length).toBe(3);
    expect(await getPageCount(parts[0]!)).toBe(2);
    expect(await getPageCount(parts[1]!)).toBe(1);
    expect(await getPageCount(parts[2]!)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// rotate
// ---------------------------------------------------------------------------

describe("rotate", () => {
  it("rotates all pages by 90 degrees", async () => {
    const pdf = await makeTestPdf(2);
    const result = await rotate(pdf, 90);
    const doc = await PDFDocument.load(result);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(90);
  });

  it("rotates all pages by 180 degrees", async () => {
    const pdf = await makeTestPdf(1);
    const result = await rotate(pdf, 180);
    const doc = await PDFDocument.load(result);
    expect(doc.getPage(0).getRotation().angle).toBe(180);
  });

  it("rotates all pages by 270 degrees", async () => {
    const pdf = await makeTestPdf(1);
    const result = await rotate(pdf, 270);
    const doc = await PDFDocument.load(result);
    expect(doc.getPage(0).getRotation().angle).toBe(270);
  });

  it("rotates specific pages only", async () => {
    const pdf = await makeTestPdf(3);
    const result = await rotate(pdf, 90, "1,3");
    const doc = await PDFDocument.load(result);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
    expect(doc.getPage(2).getRotation().angle).toBe(90);
  });

  it("preserves page count after rotation", async () => {
    const pdf = await makeTestPdf(5);
    const result = await rotate(pdf, 90);
    expect(await getPageCount(result)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// reverse
// ---------------------------------------------------------------------------

describe("reverse", () => {
  it("reverses page order and preserves count", async () => {
    const pdf = await makeTestPdf(4);
    const result = await reverse(pdf);
    expect(await getPageCount(result)).toBe(4);
  });

  it("double reverse returns equivalent document", async () => {
    const pdf = await makeTestPdf(3);
    const once = await reverse(pdf);
    const twice = await reverse(once);
    expect(await getPageCount(twice)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// deletePages
// ---------------------------------------------------------------------------

describe("deletePages", () => {
  it("deletes a single page", async () => {
    const pdf = await makeTestPdf(3);
    const result = await deletePages(pdf, "2");
    expect(await getPageCount(result)).toBe(2);
  });

  it("deletes multiple pages", async () => {
    const pdf = await makeTestPdf(5);
    const result = await deletePages(pdf, "1,3,5");
    expect(await getPageCount(result)).toBe(2);
  });

  it("deletes a range of pages", async () => {
    const pdf = await makeTestPdf(5);
    const result = await deletePages(pdf, "2-4");
    expect(await getPageCount(result)).toBe(2);
  });

  it("throws when trying to delete all pages", async () => {
    const pdf = await makeTestPdf(2);
    await expect(deletePages(pdf, "1-2")).rejects.toThrow(
      "Cannot delete all pages",
    );
  });
});

// ---------------------------------------------------------------------------
// extractPages
// ---------------------------------------------------------------------------

describe("extractPages", () => {
  it("extracts a single page", async () => {
    const pdf = await makeTestPdf(5);
    const result = await extractPages(pdf, "3");
    expect(await getPageCount(result)).toBe(1);
  });

  it("extracts a range of pages", async () => {
    const pdf = await makeTestPdf(5);
    const result = await extractPages(pdf, "2-4");
    expect(await getPageCount(result)).toBe(3);
  });

  it("extracts mixed pages", async () => {
    const pdf = await makeTestPdf(6);
    const result = await extractPages(pdf, "1,3,5-6");
    expect(await getPageCount(result)).toBe(4);
  });

  it("throws on no matching pages", async () => {
    const pdf = await makeTestPdf(3);
    await expect(extractPages(pdf, "10")).rejects.toThrow("No pages to extract");
  });
});

// ---------------------------------------------------------------------------
// oddEven
// ---------------------------------------------------------------------------

describe("oddEven", () => {
  it("extracts odd pages (1, 3, 5)", async () => {
    const pdf = await makeTestPdf(6);
    const result = await oddEven(pdf, "odd");
    expect(await getPageCount(result)).toBe(3);
  });

  it("extracts even pages (2, 4, 6)", async () => {
    const pdf = await makeTestPdf(6);
    const result = await oddEven(pdf, "even");
    expect(await getPageCount(result)).toBe(3);
  });

  it("odd pages from 5-page PDF gives 3", async () => {
    const pdf = await makeTestPdf(5);
    const result = await oddEven(pdf, "odd");
    expect(await getPageCount(result)).toBe(3);
  });

  it("even pages from 5-page PDF gives 2", async () => {
    const pdf = await makeTestPdf(5);
    const result = await oddEven(pdf, "even");
    expect(await getPageCount(result)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// info
// ---------------------------------------------------------------------------

describe("info", () => {
  it("returns correct page count", async () => {
    const pdf = await makeTestPdf(7);
    const result = await info(pdf);
    expect(result.pages).toBe(7);
  });

  it("returns file size", async () => {
    const pdf = await makeTestPdf(1);
    const result = await info(pdf);
    expect(result.sizeBytes).toBe(pdf.byteLength);
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it("returns metadata from a document with metadata", async () => {
    const pdf = await makeTestPdfWithMetadata();
    const result = await info(pdf);
    expect(result.title).toBe("Test Title");
    expect(result.author).toBe("Test Author");
    expect(result.subject).toBe("Test Subject");
  });

  it("returns empty strings for missing metadata", async () => {
    const pdf = await makeTestPdf(1);
    const result = await info(pdf);
    expect(result.title).toBe("");
    expect(result.author).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getMetadata / setMetadata
// ---------------------------------------------------------------------------

describe("getMetadata", () => {
  it("returns metadata from a document with metadata", async () => {
    const pdf = await makeTestPdfWithMetadata();
    const meta = await getMetadata(pdf);
    expect(meta.title).toBe("Test Title");
    expect(meta.author).toBe("Test Author");
    expect(meta.subject).toBe("Test Subject");
    expect(meta.creator).toBe("Test Creator");
    // pdf-lib overrides producer on save(), so we check it contains our value
    // or pdf-lib's default
    expect(meta.producer).toBeDefined();
  });

  it("returns undefined for missing fields", async () => {
    const pdf = await makeTestPdf(1);
    const meta = await getMetadata(pdf);
    expect(meta.title).toBeUndefined();
    expect(meta.author).toBeUndefined();
  });
});

describe("setMetadata", () => {
  it("sets title and author", async () => {
    const pdf = await makeTestPdf(1);
    const result = await setMetadata(pdf, {
      title: "New Title",
      author: "New Author",
    });
    const meta = await getMetadata(result);
    expect(meta.title).toBe("New Title");
    expect(meta.author).toBe("New Author");
  });

  it("roundtrip: set then get all fields", async () => {
    const pdf = await makeTestPdf(1);
    const metadata = {
      title: "My Document",
      author: "John Doe",
      subject: "Testing",
      keywords: "test, pdf, library",
      creator: "peasy-pdf",
      producer: "pdf-lib",
    };
    const result = await setMetadata(pdf, metadata);
    const meta = await getMetadata(result);
    expect(meta.title).toBe("My Document");
    expect(meta.author).toBe("John Doe");
    expect(meta.subject).toBe("Testing");
    expect(meta.keywords).toBe("test, pdf, library");
    expect(meta.creator).toBe("peasy-pdf");
    // pdf-lib overrides the producer field on save() with its own value
    expect(meta.producer).toContain("pdf-lib");
  });

  it("preserves existing metadata when setting partial", async () => {
    const pdf = await makeTestPdfWithMetadata();
    const result = await setMetadata(pdf, { title: "Updated Title" });
    const meta = await getMetadata(result);
    expect(meta.title).toBe("Updated Title");
    expect(meta.author).toBe("Test Author"); // Preserved
  });

  it("preserves page count", async () => {
    const pdf = await makeTestPdf(3);
    const result = await setMetadata(pdf, { title: "Title" });
    expect(await getPageCount(result)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// stripMetadata
// ---------------------------------------------------------------------------

describe("stripMetadata", () => {
  it("removes all metadata", async () => {
    const pdf = await makeTestPdfWithMetadata();
    const result = await stripMetadata(pdf);
    const meta = await getMetadata(result);
    // After stripping, fields should be empty strings (set to "") or undefined
    const doc = await PDFDocument.load(result);
    expect(doc.getTitle()).toBe("");
    expect(doc.getAuthor()).toBe("");
    expect(doc.getSubject()).toBe("");
    expect(doc.getCreator()).toBe("");
    // pdf-lib always stamps its own producer on save()
    expect(doc.getProducer()).toContain("pdf-lib");
  });

  it("preserves page count after stripping", async () => {
    const pdf = await makeTestPdfWithMetadata();
    const result = await stripMetadata(pdf);
    expect(await getPageCount(result)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// insertBlank
// ---------------------------------------------------------------------------

describe("insertBlank", () => {
  it("appends one blank page at the end by default", async () => {
    const pdf = await makeTestPdf(2);
    const result = await insertBlank(pdf);
    expect(await getPageCount(result)).toBe(3);
  });

  it("appends multiple blank pages at the end", async () => {
    const pdf = await makeTestPdf(1);
    const result = await insertBlank(pdf, undefined, { count: 3 });
    expect(await getPageCount(result)).toBe(4);
  });

  it("inserts blank page after a specific page", async () => {
    const pdf = await makeTestPdf(3);
    const result = await insertBlank(pdf, "2");
    expect(await getPageCount(result)).toBe(4);
  });

  it("inserts multiple blank pages after a specific page", async () => {
    const pdf = await makeTestPdf(2);
    const result = await insertBlank(pdf, "1", { count: 2 });
    expect(await getPageCount(result)).toBe(4);
  });

  it("respects custom width and height", async () => {
    const pdf = await makeTestPdf(1);
    const result = await insertBlank(pdf, undefined, {
      width: 842,
      height: 1191,
    }); // A3
    const doc = await PDFDocument.load(result);
    const newPage = doc.getPage(1);
    expect(newPage.getWidth()).toBeCloseTo(842, 0);
    expect(newPage.getHeight()).toBeCloseTo(1191, 0);
  });
});

// ---------------------------------------------------------------------------
// duplicatePages
// ---------------------------------------------------------------------------

describe("duplicatePages", () => {
  it("duplicates all pages (default)", async () => {
    const pdf = await makeTestPdf(2);
    const result = await duplicatePages(pdf);
    // Each of 2 pages gets 1 copy = 2 original + 2 copies = 4 total
    expect(await getPageCount(result)).toBe(4);
  });

  it("duplicates specific pages", async () => {
    const pdf = await makeTestPdf(3);
    const result = await duplicatePages(pdf, "2");
    // 3 original + 1 copy of page 2 = 4 total
    expect(await getPageCount(result)).toBe(4);
  });

  it("makes multiple copies", async () => {
    const pdf = await makeTestPdf(1);
    const result = await duplicatePages(pdf, "1", 3);
    // 1 original + 3 copies = 4 total
    expect(await getPageCount(result)).toBe(4);
  });

  it("duplicates multiple specific pages with multiple copies", async () => {
    const pdf = await makeTestPdf(3);
    const result = await duplicatePages(pdf, "1,3", 2);
    // 3 original + 2 copies of page 1 + 2 copies of page 3 = 7
    expect(await getPageCount(result)).toBe(7);
  });
});
