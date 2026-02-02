export interface Mem0Options {
  // Selective memory extraction (Pro feature)
  includes?: string;
  excludes?: string;

  // Extraction guidelines (Pro feature)
  customInstructions?: string;

  // NOTE: customCategories is configured at project level in Mem0 Dashboard
  // See: https://app.mem0.ai/dashboard/project-settings

  // Control options
  infer?: boolean; // Default true - whether to extract structured memories
  enableGraph?: boolean; // Build knowledge graph (Pro feature)

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
