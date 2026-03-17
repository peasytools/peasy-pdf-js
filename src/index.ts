/**
 * peasy-pdf — PDF manipulation library for Node.js.
 *
 * Merge, split, rotate, extract, reorder, and manage metadata —
 * all powered by pdf-lib with zero filesystem dependencies.
 *
 * @packageDocumentation
 */

// Types
export type {
  PdfInfo,
  PdfMetadata,
  PageSize,
  OddEvenMode,
} from "./types.js";

// Engine functions
export {
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
} from "./engine.js";

// API Client
export { PeasyPdf } from "./client.js";
export type {
  ListOptions,
  ListGuidesOptions,
  ListConversionsOptions,
  PaginatedResponse,
  Tool,
  Category,
  Format,
  Conversion,
  GlossaryTerm,
  Guide,
  UseCase,
  Site,
  SearchResult,
} from "./api-types.js";
