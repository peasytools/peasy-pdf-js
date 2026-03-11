/** Information about a PDF document. */
export interface PdfInfo {
  /** Total number of pages. */
  pages: number;
  /** Document title from metadata. */
  title: string;
  /** Document author from metadata. */
  author: string;
  /** Document subject from metadata. */
  subject: string;
  /** Creator application from metadata. */
  creator: string;
  /** PDF producer from metadata. */
  producer: string;
  /** File size in bytes. */
  sizeBytes: number;
}

/** Metadata fields that can be set on a PDF document. */
export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
}

/** Standard page sizes. */
export type PageSize = "a3" | "a4" | "a5" | "letter" | "legal" | "tabloid";

/** Mode for odd/even page extraction. */
export type OddEvenMode = "odd" | "even";
