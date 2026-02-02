/**
 * Filter conditions for advanced memory search
 */
export interface MemoryFilters {
  // Filter by categories (configured in Mem0 Dashboard)
  categories?: string[];

  // Date range filters (YYYY-MM-DD format)
  created_at?: {
    gte?: string; // Greater than or equal
    lte?: string; // Less than or equal
  };

  // Metadata filters
  metadata?: Record<string, any>;

  // Logical operators for complex queries
  AND?: MemoryFilterCondition[];
  OR?: MemoryFilterCondition[];
}

export interface MemoryFilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export class SearchMemoryDto {
  /** The search query - natural language question or keywords */
  query: string;

  /** User ID to scope the search */
  userId?: string;

  /** Maximum number of results to return */
  limit?: number;

  /** Score threshold (0-1), only return memories with score >= threshold */
  threshold?: number;

  // ============================================
  // Advanced Search Options (Pro Features)
  // ============================================

  /**
   * Enable reranking for better precision
   * Rescores initial vector search results using a reranker model
   * Trades extra latency for significantly better relevance
   */
  rerank?: boolean;

  /**
   * Number of candidates to retrieve before reranking
   * Higher values give better results but increase latency
   * Only used when rerank is true
   */
  topK?: number;

  /**
   * Enable keyword search combined with semantic search
   * Useful for finding exact matches alongside semantic matches
   */
  keywordSearch?: boolean;

  /**
   * Filter by specific categories (configured in Mem0 Dashboard)
   * e.g., ['fitness_goals', 'injuries_limitations']
   */
  categories?: string[];

  /**
   * Filter by date range
   */
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD

  /**
   * Advanced filters using JSON logic
   * Supports AND/OR conditions, metadata filtering, etc.
   */
  filters?: MemoryFilters;

  /**
   * Include graph relationships in search results
   * Returns related entities and their connections
   */
  includeGraph?: boolean;

  /**
   * Output format version
   */
  outputFormat?: 'v1' | 'v1.1';
}

/**
 * DTO for graph-specific queries
 */
export class GraphSearchDto {
  /** User ID to scope the search */
  userId: string;

  /** Entity name to find relationships for */
  entityName?: string;

  /** Entity type filter (e.g., 'Person', 'Exercise', 'Injury') */
  entityType?: string;

  /** Relationship type filter (e.g., 'CAUSES', 'PREVENTS', 'RELATED_TO') */
  relationshipType?: string;

  /** Maximum depth of relationship traversal */
  depth?: number;

  /** Maximum number of results */
  limit?: number;
}
