export interface Mem0Options {
  // Selective memory extraction
  includes?: string;
  excludes?: string;

  // Extraction guidelines
  customInstructions?: string;

  // Custom categories for domain-specific labeling
  customCategories?: Record<string, string>;

  // Control options
  infer?: boolean; // Default true
  version?: string; // "v2" recommended
  enableGraph?: boolean; // Build knowledge graph

  // Temporal options
  timestamp?: number; // Unix timestamp
  expirationDate?: string; // YYYY-MM-DD
  immutable?: boolean; // Prevent updates
}

export class AddMemoryDto {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
  metadata?: Record<string, any>;

  // Advanced Mem0 options
  options?: Mem0Options;
}

export class AddMemoryFromTextDto {
  content: string;
  userId?: string;
  metadata?: Record<string, any>;

  // Advanced Mem0 options
  options?: Mem0Options;
}
