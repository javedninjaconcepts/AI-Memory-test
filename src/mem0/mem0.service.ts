import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MemoryClient from 'mem0ai';
import {
  AddMemoryDto,
  AddMemoryFromTextDto,
  Mem0Options,
} from './dto/add-memory.dto';
import { SearchMemoryDto, GraphSearchDto } from './dto/search-memory.dto';
import {
  SEARCH_DEFAULT_TOP_K,
  SEARCH_RERANK_TOP_K,
} from '../constants';
import {
  FITNESS_MEM0_DEFAULTS,
  FITNESS_MEM0_PRO_OPTIONS,
} from '../constants';

export interface MemoryResult {
  id: string;
  memory: string;
  user_id?: string;
  agent_id?: string;
  run_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AddMemoryResult {
  results: Array<{
    id: string;
    memory: string;
    event: string;
  }>;
}

export interface SearchResult {
  id: string;
  memory: string;
  score: number;
  user_id?: string;
  agent_id?: string;
  metadata?: Record<string, any>;
  categories?: string[];
  created_at?: string;
}

export interface GraphEntity {
  name: string;
  type: string;
  properties?: Record<string, any>;
}

export interface GraphRelationship {
  source: string;
  target: string;
  relationship: string;
  properties?: Record<string, any>;
}

export interface GraphSearchResult {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
}

export interface AdvancedSearchResult {
  memories: SearchResult[];
  graph?: GraphSearchResult;
  totalCount?: number;
  reranked?: boolean;
}

@Injectable()
export class Mem0Service implements OnModuleInit {
  private client: MemoryClient;
  private isProTier: boolean = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('MEM0_API_KEY');
    this.isProTier =
      this.configService.get<string>('MEM0_PRO_TIER') === 'true';

    if (!apiKey) {
      console.warn(
        'MEM0_API_KEY is not defined. Mem0 features will not work.',
      );
      return;
    }

    if (this.isProTier) {
      console.log(
        '✅ Mem0 Pro tier enabled - using advanced fitness extraction features',
      );
    } else {
      console.log(
        '📝 Mem0 Free tier - basic memory features only. Set MEM0_PRO_TIER=true for advanced features.',
      );
    }

    this.client = new MemoryClient({
      apiKey,
    });
  }

  /**
   * Build Mem0 API options from our Mem0Options interface
   */
  private buildMem0Options(
    baseOptions: Record<string, any>,
    mem0Options?: Mem0Options,
  ): Record<string, any> {
    const options = { ...baseOptions };

    // Start with free tier defaults
    let mergedMem0Options = { ...FITNESS_MEM0_DEFAULTS, ...mem0Options };

    // Apply pro options if pro tier is enabled
    if (this.isProTier) {
      mergedMem0Options = {
        ...FITNESS_MEM0_PRO_OPTIONS,
        ...mergedMem0Options,
      };
    }

    // Only apply options that are set
    // NOTE: custom_categories is configured at project level in Mem0 Dashboard, not via API
    if (mergedMem0Options.includes)
      options.includes = mergedMem0Options.includes;
    if (mergedMem0Options.excludes)
      options.excludes = mergedMem0Options.excludes;
    if (mergedMem0Options.customInstructions)
      options.custom_instructions = mergedMem0Options.customInstructions;
    if (mergedMem0Options.infer !== undefined)
      options.infer = mergedMem0Options.infer;
    // NOTE: version parameter removed in v1.0.0 - now set at client level
    if (mergedMem0Options.enableGraph !== undefined)
      options.enable_graph = mergedMem0Options.enableGraph;
    if (mergedMem0Options.timestamp)
      options.timestamp = mergedMem0Options.timestamp;
    if (mergedMem0Options.expirationDate)
      options.expiration_date = mergedMem0Options.expirationDate;
    if (mergedMem0Options.immutable !== undefined)
      options.immutable = mergedMem0Options.immutable;

    return options;
  }

  private ensureClient(): void {
    if (!this.client) {
      throw new Error('Mem0 client not initialized. Please set MEM0_API_KEY.');
    }
  }

  /**
   * Add memories from conversation messages
   * Only uses user_id for memory association (no agent_id or run_id)
   */
  async addMemory(dto: AddMemoryDto): Promise<AddMemoryResult> {
    this.ensureClient();

    const baseOptions: Record<string, any> = {};

    // Only use user_id for memory association
    if (dto.userId) baseOptions.user_id = dto.userId;
    if (dto.metadata) baseOptions.metadata = dto.metadata;

    // Apply fitness-optimized Mem0 options
    const options = this.buildMem0Options(baseOptions, dto.options);

    const result = await this.client.add(dto.messages, options);
    return result as unknown as AddMemoryResult;
  }

  /**
   * Add memory from raw text content (for file uploads)
   * Only uses user_id for memory association (no agent_id or run_id)
   */
  async addFromText(dto: AddMemoryFromTextDto): Promise<AddMemoryResult> {
    this.ensureClient();

    // Convert text content to a message format for Mem0
    const messages = [
      {
        role: 'user' as const,
        content: `Please remember the following information: ${dto.content}`,
      },
      {
        role: 'assistant' as const,
        content:
          'I have noted and will remember this information for future reference.',
      },
    ];

    const baseOptions: Record<string, any> = {};

    // Only use user_id for memory association
    if (dto.userId) baseOptions.user_id = dto.userId;
    if (dto.metadata) baseOptions.metadata = dto.metadata;

    // Apply fitness-optimized Mem0 options
    const options = this.buildMem0Options(baseOptions, dto.options);

    const result = await this.client.add(messages, options);
    return result as unknown as AddMemoryResult;
  }

  /**
   * Update an existing memory
   */
  async updateMemory(
    memoryId: string,
    text: string,
    metadata?: Record<string, any>,
  ): Promise<any> {
    this.ensureClient();

    const updateData: { text?: string; metadata?: Record<string, any> } = {
      text,
    };
    if (metadata) {
      updateData.metadata = metadata;
    }

    const result = await this.client.update(memoryId, updateData);
    return result;
  }

  /**
   * Search memories using semantic search with advanced filtering options
   * Supports reranking, category filters, date ranges, and graph inclusion
   *
   * @param dto - Search parameters including filters and options
   * @returns Array of search results sorted by relevance
   */
  async searchMemory(dto: SearchMemoryDto): Promise<SearchResult[]> {
    this.ensureClient();

    const options: Record<string, any> = {};

    // Basic options
    if (dto.userId) options.user_id = dto.userId;
    if (dto.limit) options.limit = dto.limit;
    if (dto.threshold !== undefined) options.threshold = dto.threshold;

    // Pro tier: Reranking options
    if (this.isProTier && dto.rerank) {
      options.rerank = true;
      options.top_k = dto.topK || SEARCH_RERANK_TOP_K;
    } else if (dto.topK) {
      options.top_k = dto.topK;
    }

    // Pro tier: Keyword search
    if (this.isProTier && dto.keywordSearch) {
      options.keyword_search = true;
    }

    // Pro tier: Output format
    if (dto.outputFormat) {
      options.output_format = dto.outputFormat;
    }

    // Build filters object
    const filters = this.buildSearchFilters(dto);
    if (Object.keys(filters).length > 0) {
      options.filters = filters;
    }

    const results = await this.client.search(dto.query, options);
    return results as unknown as SearchResult[];
  }

  /**
   * Advanced search with reranking and optional graph data
   * Returns enriched results including graph relationships when enabled
   *
   * @param dto - Search parameters with advanced options
   * @returns Advanced search result with memories and optional graph data
   */
  async advancedSearch(dto: SearchMemoryDto): Promise<AdvancedSearchResult> {
    this.ensureClient();

    const options: Record<string, any> = {};

    // Basic options
    if (dto.userId) options.user_id = dto.userId;
    if (dto.threshold !== undefined) options.threshold = dto.threshold;

    // For advanced search, always use reranking if Pro tier
    if (this.isProTier) {
      options.rerank = dto.rerank !== false; // Default to true for Pro
      options.top_k = dto.topK || SEARCH_RERANK_TOP_K;

      if (dto.keywordSearch) {
        options.keyword_search = true;
      }
    }

    // Set limit after reranking
    if (dto.limit) options.limit = dto.limit;

    // Build filters
    const filters = this.buildSearchFilters(dto);
    if (Object.keys(filters).length > 0) {
      options.filters = filters;
    }

    // Perform search
    const memories = (await this.client.search(
      dto.query,
      options,
    )) as unknown as SearchResult[];

    const result: AdvancedSearchResult = {
      memories,
      reranked: this.isProTier && (dto.rerank !== false),
    };

    // Include graph data if requested
    if (dto.includeGraph && dto.userId && this.isProTier) {
      try {
        const graphData = await this.getGraphRelationships({
          userId: dto.userId,
          limit: dto.limit || SEARCH_DEFAULT_TOP_K,
        });
        result.graph = graphData;
      } catch (error) {
        console.warn('Failed to fetch graph data:', error.message);
      }
    }

    return result;
  }

  /**
   * Build search filters from DTO parameters
   */
  private buildSearchFilters(dto: SearchMemoryDto): Record<string, any> {
    const filters: Record<string, any> = {};

    // Category filters
    if (dto.categories?.length) {
      filters.categories = { in: dto.categories };
    }

    // Date range filters
    if (dto.dateFrom || dto.dateTo) {
      filters.created_at = {};
      if (dto.dateFrom) filters.created_at.gte = dto.dateFrom;
      if (dto.dateTo) filters.created_at.lte = dto.dateTo;
    }

    // Advanced filters passed directly
    if (dto.filters) {
      if (dto.filters.AND) filters.AND = dto.filters.AND;
      if (dto.filters.OR) filters.OR = dto.filters.OR;
      if (dto.filters.metadata) {
        filters.metadata = dto.filters.metadata;
      }
      // Merge any additional filter conditions
      if (dto.filters.categories && !filters.categories) {
        filters.categories = dto.filters.categories;
      }
      if (dto.filters.created_at && !filters.created_at) {
        filters.created_at = dto.filters.created_at;
      }
    }

    return filters;
  }

  // ============================================
  // Graph Memory Methods (Pro Feature)
  // ============================================

  /**
   * Get graph entities for a user
   * Returns entities extracted from memories with their types and properties
   *
   * @param dto - Graph search parameters
   * @returns Array of graph entities
   */
  async getGraphEntities(dto: GraphSearchDto): Promise<GraphEntity[]> {
    this.ensureClient();

    if (!this.isProTier) {
      console.warn('Graph features require Pro tier. Returning empty results.');
      return [];
    }

    try {
      const options: Record<string, any> = {
        user_id: dto.userId,
      };

      if (dto.entityType) options.type = dto.entityType;
      if (dto.limit) options.limit = dto.limit;

      // Use the entities endpoint
      const entities = await (this.client as any).getEntities(options);
      return entities as GraphEntity[];
    } catch (error) {
      console.error('Failed to get graph entities:', error.message);
      return [];
    }
  }

  /**
   * Get graph relationships for entities
   * Returns relationships between entities in the knowledge graph
   *
   * @param dto - Graph search parameters
   * @returns Graph search result with entities and relationships
   */
  async getGraphRelationships(dto: GraphSearchDto): Promise<GraphSearchResult> {
    this.ensureClient();

    if (!this.isProTier) {
      console.warn('Graph features require Pro tier. Returning empty results.');
      return { entities: [], relationships: [] };
    }

    try {
      const options: Record<string, any> = {
        user_id: dto.userId,
      };

      if (dto.entityName) options.entity = dto.entityName;
      if (dto.relationshipType) options.relationship_type = dto.relationshipType;
      if (dto.depth) options.depth = dto.depth;
      if (dto.limit) options.limit = dto.limit;

      // Use the relations endpoint
      const result = await (this.client as any).getRelations(options);

      return {
        entities: result.entities || [],
        relationships: result.relationships || result.relations || [],
      };
    } catch (error) {
      console.error('Failed to get graph relationships:', error.message);
      return { entities: [], relationships: [] };
    }
  }

  /**
   * Search graph by entity name
   * Find all memories and relationships connected to a specific entity
   *
   * @param userId - User ID
   * @param entityName - Name of the entity to search for
   * @returns Graph search result with related entities and relationships
   */
  async searchGraphByEntity(
    userId: string,
    entityName: string,
  ): Promise<GraphSearchResult> {
    return this.getGraphRelationships({
      userId,
      entityName,
    });
  }

  /**
   * Get entities by type
   * Useful for finding all exercises, injuries, foods, etc.
   *
   * @param userId - User ID
   * @param entityType - Type of entities to find (e.g., 'Exercise', 'Injury', 'Food')
   * @param limit - Maximum number of results
   * @returns Array of matching entities
   */
  async getEntitiesByType(
    userId: string,
    entityType: string,
    limit?: number,
  ): Promise<GraphEntity[]> {
    return this.getGraphEntities({
      userId,
      entityType,
      limit,
    });
  }

  /**
   * Find related memories through graph traversal
   * Combines semantic search with graph relationships for richer context
   *
   * @param query - Search query
   * @param userId - User ID
   * @param depth - How many relationship hops to traverse (default: 1)
   * @returns Search results enriched with related graph data
   */
  async searchWithGraphContext(
    query: string,
    userId: string,
    depth: number = 1,
  ): Promise<AdvancedSearchResult> {
    // First, perform semantic search
    const searchResult = await this.advancedSearch({
      query,
      userId,
      rerank: true,
      includeGraph: true,
    });

    // If we have graph data and want deeper traversal
    if (searchResult.graph && depth > 1 && this.isProTier) {
      try {
        // Extract entity names from initial results
        const entityNames = searchResult.graph.entities.map((e) => e.name);

        // Get deeper relationships for each entity
        const deeperRelationships: GraphRelationship[] = [];
        const deeperEntities: GraphEntity[] = [];

        for (const entityName of entityNames.slice(0, 5)) {
          // Limit to top 5
          const related = await this.getGraphRelationships({
            userId,
            entityName,
            depth: depth - 1,
          });
          deeperRelationships.push(...related.relationships);
          deeperEntities.push(...related.entities);
        }

        // Merge and deduplicate
        const allEntities = [
          ...searchResult.graph.entities,
          ...deeperEntities,
        ].filter(
          (e, i, arr) => arr.findIndex((x) => x.name === e.name) === i,
        );

        const allRelationships = [
          ...searchResult.graph.relationships,
          ...deeperRelationships,
        ].filter(
          (r, i, arr) =>
            arr.findIndex(
              (x) =>
                x.source === r.source &&
                x.target === r.target &&
                x.relationship === r.relationship,
            ) === i,
        );

        searchResult.graph = {
          entities: allEntities,
          relationships: allRelationships,
        };
      } catch (error) {
        console.warn('Failed to get deeper graph relationships:', error.message);
      }
    }

    return searchResult;
  }

  /**
   * Get all memories for a user
   */
  async getMemories(userId: string): Promise<MemoryResult[]> {
    this.ensureClient();

    const results = await this.client.getAll({ user_id: userId });
    return results as unknown as MemoryResult[];
  }

  /**
   * Get memories by agent
   */
  async getMemoriesByAgent(agentId: string): Promise<MemoryResult[]> {
    this.ensureClient();

    const results = await this.client.getAll({ agent_id: agentId });
    return results as unknown as MemoryResult[];
  }

  /**
   * Get a specific memory by ID
   */
  async getMemory(memoryId: string): Promise<MemoryResult> {
    this.ensureClient();

    const result = await this.client.get(memoryId);
    return result as unknown as MemoryResult;
  }

  /**
   * Delete a specific memory
   */
  async deleteMemory(memoryId: string): Promise<{ message: string }> {
    this.ensureClient();

    await this.client.delete(memoryId);
    return { message: `Memory ${memoryId} deleted successfully` };
  }

  /**
   * Delete all memories for a user
   */
  async deleteAllUserMemories(userId: string): Promise<{ message: string }> {
    this.ensureClient();

    await this.client.deleteAll({ user_id: userId });
    return { message: `All memories for user ${userId} deleted successfully` };
  }

  /**
   * Get memory history for a specific memory
   */
  async getMemoryHistory(memoryId: string): Promise<any[]> {
    this.ensureClient();

    const history = await this.client.history(memoryId);
    return history as any[];
  }

  // ============================================
  // Project Configuration Methods (Pro Feature)
  // ============================================

  /**
   * Get current project settings including custom categories and instructions
   */
  async getProjectSettings(): Promise<{
    custom_instructions?: string;
    custom_categories?: any[];
    [key: string]: any;
  }> {
    this.ensureClient();

    const settings = await this.client.getProject({ fields: [] });
    return settings;
  }

  /**
   * Update project custom instructions
   * This sets the default extraction guidelines for all memory operations
   */
  async updateCustomInstructions(
    instructions: string,
  ): Promise<{ success: boolean; message: string }> {
    this.ensureClient();

    try {
      await this.client.updateProject({
        custom_instructions: instructions,
      });
      return {
        success: true,
        message: 'Custom instructions updated successfully',
      };
    } catch (error) {
      throw new Error(`Failed to update custom instructions: ${error.message}`);
    }
  }

  /**
   * Update project custom categories
   * Custom categories replace Mem0's default labels (travel, sports, music, etc.)
   * with your domain-specific categories
   *
   * @param categories - Array of category objects, e.g.:
   *   [
   *     { fitness_goals: 'Weight loss, muscle gain, endurance goals' },
   *     { dietary_info: 'Food preferences, allergies, meal timing' },
   *   ]
   */
  async updateCustomCategories(
    categories: Array<Record<string, string>>,
  ): Promise<{ success: boolean; message: string }> {
    this.ensureClient();

    try {
      await this.client.updateProject({
        custom_categories: categories,
      });
      return {
        success: true,
        message: `${categories.length} custom categories configured successfully`,
      };
    } catch (error) {
      throw new Error(`Failed to update custom categories: ${error.message}`);
    }
  }

}
