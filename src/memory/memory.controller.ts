/// <reference types="express" />
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  Mem0Service,
  SearchResult,
  MemoryResult,
  AdvancedSearchResult,
  GraphEntity,
  GraphSearchResult,
} from '../mem0/mem0.service';
import { ChatGPTService } from '../chatgpt.service';
import { UsersService } from '../users/users.service';
import { ChatWithMemoryDto } from './dto/chat-with-memory.dto';
import {
  MEMORY_SEARCH_THRESHOLD,
  MEMORY_SEARCH_LIMIT,
  MEMORY_SEARCH_DEFAULT_LIMIT,
  GRAPH_DEFAULT_DEPTH,
  GRAPH_MAX_DEPTH,
  GRAPH_DEFAULT_ENTITY_LIMIT,
} from '../constants';

interface ChatResponse {
  success: boolean;
  message: string;
  response: string;
  memoriesUsed: string[];
  newMemoriesCreated: number;
  profileCompleteness?: number;
  isNewUser?: boolean;
}

interface UploadResponse {
  success: boolean;
  fileName: string;
  memoriesExtracted: number;
  message: string;
}

@Controller('memory')
export class MemoryController {
  constructor(
    private readonly mem0Service: Mem0Service,
    private readonly chatGPTService: ChatGPTService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Chat with memory - retrieves relevant memories and stores new ones
   * The AI acts as a fitness coach that proactively asks questions
   * to build the user's fitness profile
   */
  @Post('chat')
  async chatWithMemory(@Body() dto: ChatWithMemoryDto): Promise<ChatResponse> {
    if (!dto.message) {
      throw new BadRequestException('Message is required');
    }

    if (!dto.userId) {
      throw new BadRequestException('userId is required');
    }

    // Verify user exists
    if (!this.usersService.userExists(dto.userId)) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    try {
      // Step 1: Get ALL user memories to understand their complete profile
      const allMemories = await this.mem0Service.getMemories(dto.userId);
      const isNewUser = allMemories.length === 0;

      // Step 2: Search for relevant memories for this specific query
      const relevantMemories = await this.mem0Service.searchMemory({
        query: dto.message,
        userId: dto.userId,
        limit: MEMORY_SEARCH_LIMIT,
        threshold: MEMORY_SEARCH_THRESHOLD,
      });

      // Step 3: Build comprehensive context from ALL memories for profile analysis
      // But only pass relevant ones to the response generation
      const fullProfileContext = this.buildFullProfileContext(allMemories);
      const relevantContext = this.buildMemoryContext(relevantMemories);
      const memoriesUsed = relevantMemories.map((m) => m.memory);

      // Combine relevant context with profile overview
      const combinedContext = fullProfileContext
        ? `${fullProfileContext}\n\n--- RELEVANT TO CURRENT QUERY ---\n${relevantContext || 'No specific memories match this query.'}`
        : relevantContext;

      // Log for debugging
      if (isNewUser) {
        console.log('👋 New user detected - will use onboarding flow');
      } else {
        console.log(`📚 User has ${allMemories.length} total memories`);
        if (relevantMemories.length > 0) {
          console.log(`   Found ${relevantMemories.length} relevant to query:`);
          relevantMemories.forEach((m, i) => {
            console.log(`   ${i + 1}. [Score: ${m.score.toFixed(3)}] ${m.memory}`);
          });
        }
      }

      // Step 4: Analyze profile completeness
      const profileAnalysis = this.chatGPTService.analyzeProfileCompleteness(
        fullProfileContext || '',
      );
      console.log(`📊 Profile ${profileAnalysis.completionPercentage}% complete`);
      if (profileAnalysis.missingCategories.length > 0) {
        console.log(`   Missing: ${profileAnalysis.missingCategories.join(', ')}`);
      }

      // Step 5: Get AI response with context (AI will ask questions as needed)
      const aiResponse = await this.chatGPTService.chatWithContext(
        dto.message,
        combinedContext,
        isNewUser,
      );

      // Step 6: Store the conversation in memory
      const memoryResult = await this.mem0Service.addMemory({
        messages: [
          { role: 'user', content: dto.message },
          { role: 'assistant', content: aiResponse },
        ],
        userId: dto.userId,
      });

      return {
        success: true,
        message: dto.message,
        response: aiResponse,
        memoriesUsed,
        newMemoriesCreated: memoryResult.results?.length || 0,
        profileCompleteness: profileAnalysis.completionPercentage,
        isNewUser,
      };
    } catch (error) {
      throw new BadRequestException(`Chat failed: ${error.message}`);
    }
  }

  /**
   * Upload a file for memory extraction
   */
  /**
   * Upload a file for memory extraction
   * Only uses user_id for memory association
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    // @Body('agentId') agentId?: string,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    // Verify user exists
    if (!this.usersService.userExists(userId)) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      // Read file content
      const content = file.buffer.toString('utf-8');

      if (!content.trim()) {
        throw new BadRequestException('File is empty');
      }

      // Store file content as memory by user_id only
      const result = await this.mem0Service.addFromText({
        content,
        userId,
        // agentId,
        metadata: {
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      });

      return {
        success: true,
        fileName: file.originalname,
        memoriesExtracted: result.results?.length || 0,
        message: 'File processed and memories stored successfully',
      };
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Semantic search across memories with advanced filtering
   * Supports reranking, category filters, date ranges, and keyword search
   *
   * @param q - Search query (required)
   * @param userId - User ID (required)
   * @param limit - Maximum results to return
   * @param threshold - Score threshold (0-1)
   * @param rerank - Enable reranking for better precision (Pro feature)
   * @param categories - Comma-separated category filters (e.g., "fitness_goals,injuries")
   * @param dateFrom - Filter memories from this date (YYYY-MM-DD)
   * @param dateTo - Filter memories until this date (YYYY-MM-DD)
   * @param keywordSearch - Enable keyword search (Pro feature)
   */
  @Get('search')
  async searchMemories(
    @Query('q') query: string,
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('threshold') threshold?: string,
    @Query('rerank') rerank?: string,
    @Query('categories') categories?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('keywordSearch') keywordSearch?: string,
    @Query('topK') topK?: string,
  ): Promise<{ success: boolean; results: SearchResult[] }> {
    if (!query) {
      throw new BadRequestException('Query parameter "q" is required');
    }

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    try {
      const results = await this.mem0Service.searchMemory({
        query,
        userId,
        limit: limit ? parseInt(limit, 10) : MEMORY_SEARCH_DEFAULT_LIMIT,
        threshold: threshold ? parseFloat(threshold) : undefined,
        rerank: rerank === 'true',
        categories: categories ? categories.split(',').map((c) => c.trim()) : undefined,
        dateFrom,
        dateTo,
        keywordSearch: keywordSearch === 'true',
        topK: topK ? parseInt(topK, 10) : undefined,
      });

      return {
        success: true,
        results,
      };
    } catch (error) {
      throw new BadRequestException(`Search failed: ${error.message}`);
    }
  }

  /**
   * Advanced search with reranking and optional graph context (Pro Feature)
   * Returns enriched results including graph relationships when enabled
   *
   * POST body:
   * - query: Search query (required)
   * - userId: User ID (required)
   * - limit: Maximum results
   * - threshold: Score threshold (0-1)
   * - rerank: Enable reranking (default: true for Pro)
   * - categories: Array of category filters
   * - dateFrom/dateTo: Date range filters
   * - includeGraph: Include graph relationships in response
   */
  @Post('search/advanced')
  async advancedSearch(
    @Body()
    body: {
      query: string;
      userId: string;
      limit?: number;
      threshold?: number;
      rerank?: boolean;
      topK?: number;
      categories?: string[];
      dateFrom?: string;
      dateTo?: string;
      keywordSearch?: boolean;
      includeGraph?: boolean;
    },
  ): Promise<{ success: boolean; result: AdvancedSearchResult }> {
    if (!body.query) {
      throw new BadRequestException('query is required');
    }

    if (!body.userId) {
      throw new BadRequestException('userId is required');
    }

    try {
      const result = await this.mem0Service.advancedSearch({
        query: body.query,
        userId: body.userId,
        limit: body.limit || MEMORY_SEARCH_DEFAULT_LIMIT,
        threshold: body.threshold,
        rerank: body.rerank,
        topK: body.topK,
        categories: body.categories,
        dateFrom: body.dateFrom,
        dateTo: body.dateTo,
        keywordSearch: body.keywordSearch,
        includeGraph: body.includeGraph,
      });

      return {
        success: true,
        result,
      };
    } catch (error) {
      throw new BadRequestException(`Advanced search failed: ${error.message}`);
    }
  }

  /**
   * Search with graph context (Pro Feature)
   * Combines semantic search with graph traversal for richer context
   *
   * @param q - Search query
   * @param userId - User ID
   * @param depth - Graph traversal depth (1-3, default: 1)
   */
  @Get('search/graph')
  async searchWithGraph(
    @Query('q') query: string,
    @Query('userId') userId: string,
    @Query('depth') depth?: string,
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; result: AdvancedSearchResult }> {
    if (!query) {
      throw new BadRequestException('Query parameter "q" is required');
    }

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const depthNum = depth ? parseInt(depth, 10) : GRAPH_DEFAULT_DEPTH;
    if (depthNum < 1 || depthNum > GRAPH_MAX_DEPTH) {
      throw new BadRequestException(
        `depth must be between 1 and ${GRAPH_MAX_DEPTH}`,
      );
    }

    try {
      const result = await this.mem0Service.searchWithGraphContext(
        query,
        userId,
        depthNum,
      );

      return {
        success: true,
        result,
      };
    } catch (error) {
      throw new BadRequestException(
        `Graph search failed: ${error.message}`,
      );
    }
  }

  // ============================================
  // Graph Query Endpoints (Pro Feature)
  // ============================================

  /**
   * Get graph entities for a user (Pro Feature)
   * Returns entities extracted from memories (people, places, exercises, etc.)
   *
   * @param userId - User ID (required)
   * @param type - Filter by entity type (optional, e.g., "Exercise", "Injury", "Food")
   * @param limit - Maximum number of entities to return
   */
  @Get('graph/entities')
  async getGraphEntities(
    @Query('userId') userId: string,
    @Query('type') entityType?: string,
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; entities: GraphEntity[] }> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    try {
      const entities = await this.mem0Service.getGraphEntities({
        userId,
        entityType,
        limit: limit ? parseInt(limit, 10) : GRAPH_DEFAULT_ENTITY_LIMIT,
      });

      return {
        success: true,
        entities,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get graph entities: ${error.message}`,
      );
    }
  }

  /**
   * Get graph relationships (Pro Feature)
   * Returns relationships between entities in the knowledge graph
   *
   * @param userId - User ID (required)
   * @param entity - Filter by entity name (optional)
   * @param relationshipType - Filter by relationship type (optional)
   * @param depth - Traversal depth (optional, default: 1)
   */
  @Get('graph/relationships')
  async getGraphRelationships(
    @Query('userId') userId: string,
    @Query('entity') entityName?: string,
    @Query('relationshipType') relationshipType?: string,
    @Query('depth') depth?: string,
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; result: GraphSearchResult }> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const depthNum = depth ? parseInt(depth, 10) : GRAPH_DEFAULT_DEPTH;
    if (depthNum < 1 || depthNum > GRAPH_MAX_DEPTH) {
      throw new BadRequestException(
        `depth must be between 1 and ${GRAPH_MAX_DEPTH}`,
      );
    }

    try {
      const result = await this.mem0Service.getGraphRelationships({
        userId,
        entityName,
        relationshipType,
        depth: depthNum,
        limit: limit ? parseInt(limit, 10) : GRAPH_DEFAULT_ENTITY_LIMIT,
      });

      return {
        success: true,
        result,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get graph relationships: ${error.message}`,
      );
    }
  }

  /**
   * Search graph by entity name (Pro Feature)
   * Find all memories and relationships connected to a specific entity
   *
   * @param userId - User ID
   * @param entity - Entity name to search for (e.g., "knee", "running", "protein")
   */
  @Get('graph/entity/:entity')
  async searchGraphByEntity(
    @Param('entity') entityName: string,
    @Query('userId') userId: string,
  ): Promise<{ success: boolean; result: GraphSearchResult }> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    if (!entityName) {
      throw new BadRequestException('entity parameter is required');
    }

    try {
      const result = await this.mem0Service.searchGraphByEntity(
        userId,
        entityName,
      );

      return {
        success: true,
        result,
      };
    } catch (error) {
      throw new BadRequestException(
        `Graph entity search failed: ${error.message}`,
      );
    }
  }

  /**
   * Get entities by type (Pro Feature)
   * Useful for finding all exercises, injuries, foods, etc.
   *
   * @param type - Entity type (e.g., "Exercise", "Injury", "Food", "Person")
   * @param userId - User ID
   * @param limit - Maximum results
   */
  @Get('graph/type/:type')
  async getEntitiesByType(
    @Param('type') entityType: string,
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; entities: GraphEntity[] }> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    if (!entityType) {
      throw new BadRequestException('type parameter is required');
    }

    try {
      const entities = await this.mem0Service.getEntitiesByType(
        userId,
        entityType,
        limit ? parseInt(limit, 10) : GRAPH_DEFAULT_ENTITY_LIMIT,
      );

      return {
        success: true,
        entities,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get entities by type: ${error.message}`,
      );
    }
  }

  /**
   * Get all memories for a user
   */
  @Get('user/:userId')
  async getUserMemories(
    @Param('userId') userId: string,
  ): Promise<{ success: boolean; memories: MemoryResult[] }> {
    // Verify user exists
    if (!this.usersService.userExists(userId)) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      const memories = await this.mem0Service.getMemories(userId);
      return {
        success: true,
        memories,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get memories: ${error.message}`,
      );
    }
  }

  /**
   * Get memories by agent
   */
  @Get('agent/:agentId')
  async getAgentMemories(
    @Param('agentId') agentId: string,
  ): Promise<{ success: boolean; memories: MemoryResult[] }> {
    try {
      const memories = await this.mem0Service.getMemoriesByAgent(agentId);
      return {
        success: true,
        memories,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get agent memories: ${error.message}`,
      );
    }
  }

  /**
   * Get a specific memory by ID
   */
  @Get(':memoryId')
  async getMemory(
    @Param('memoryId') memoryId: string,
  ): Promise<{ success: boolean; memory: MemoryResult }> {
    try {
      const memory = await this.mem0Service.getMemory(memoryId);
      return {
        success: true,
        memory,
      };
    } catch (error) {
      throw new NotFoundException(`Memory ${memoryId} not found`);
    }
  }

  /**
   * Get memory history
   */
  @Get(':memoryId/history')
  async getMemoryHistory(
    @Param('memoryId') memoryId: string,
  ): Promise<{ success: boolean; history: any[] }> {
    try {
      const history = await this.mem0Service.getMemoryHistory(memoryId);
      return {
        success: true,
        history,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get memory history: ${error.message}`,
      );
    }
  }

  /**
   * Update an existing memory
   */
  @Put(':memoryId')
  async updateMemory(
    @Param('memoryId') memoryId: string,
    @Body('text') text: string,
    @Body('metadata') metadata?: Record<string, any>,
  ): Promise<{ success: boolean; memory: any }> {
    if (!text) {
      throw new BadRequestException('Text is required for memory update');
    }

    try {
      const result = await this.mem0Service.updateMemory(
        memoryId,
        text,
        metadata,
      );
      return {
        success: true,
        memory: result,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update memory: ${error.message}`,
      );
    }
  }

  /**
   * Delete a specific memory
   */
  @Delete(':memoryId')
  async deleteMemory(
    @Param('memoryId') memoryId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.mem0Service.deleteMemory(memoryId);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete memory: ${error.message}`,
      );
    }
  }

  /**
   * Delete all memories for a user
   */
  @Delete('user/:userId/all')
  async deleteAllUserMemories(
    @Param('userId') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verify user exists
    if (!this.usersService.userExists(userId)) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      const result = await this.mem0Service.deleteAllUserMemories(userId);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete user memories: ${error.message}`,
      );
    }
  }

  /**
   * Build context string from relevant memories
   */
  private buildMemoryContext(memories: SearchResult[]): string {
    if (!memories || memories.length === 0) {
      return '';
    }

    const memoryStrings = memories.map((m, i) => `${i + 1}. ${m.memory}`);
    return `Here is what I remember about this user:\n${memoryStrings.join('\n')}\n\nUse this context to provide a personalized response.`;
  }

  /**
   * Build a comprehensive profile context from ALL user memories
   * This helps the AI understand the user's complete fitness profile
   */
  private buildFullProfileContext(memories: MemoryResult[]): string {
    if (!memories || memories.length === 0) {
      return '';
    }

    // Group memories by likely category based on keywords
    const categorized: Record<string, string[]> = {
      'Personal Info': [],
      'Fitness Goals': [],
      'Exercise & Training': [],
      'Injuries & Limitations': [],
      'Diet & Nutrition': [],
      'Lifestyle': [],
      'Other': [],
    };

    for (const memory of memories) {
      const text = memory.memory.toLowerCase();

      if (
        text.includes('name') ||
        text.includes('age') ||
        text.includes('years old') ||
        text.includes('height') ||
        text.includes('weight') ||
        text.includes('male') ||
        text.includes('female')
      ) {
        categorized['Personal Info'].push(memory.memory);
      } else if (
        text.includes('goal') ||
        text.includes('want to') ||
        text.includes('trying to') ||
        text.includes('target') ||
        text.includes('aim')
      ) {
        categorized['Fitness Goals'].push(memory.memory);
      } else if (
        text.includes('workout') ||
        text.includes('exercise') ||
        text.includes('training') ||
        text.includes('gym') ||
        text.includes('run') ||
        text.includes('lift') ||
        text.includes('cardio')
      ) {
        categorized['Exercise & Training'].push(memory.memory);
      } else if (
        text.includes('injury') ||
        text.includes('pain') ||
        text.includes('hurt') ||
        text.includes('surgery') ||
        text.includes('avoid') ||
        text.includes('limitation')
      ) {
        categorized['Injuries & Limitations'].push(memory.memory);
      } else if (
        text.includes('diet') ||
        text.includes('eat') ||
        text.includes('food') ||
        text.includes('allergy') ||
        text.includes('protein') ||
        text.includes('calorie') ||
        text.includes('meal')
      ) {
        categorized['Diet & Nutrition'].push(memory.memory);
      } else if (
        text.includes('sleep') ||
        text.includes('work') ||
        text.includes('job') ||
        text.includes('stress') ||
        text.includes('equipment')
      ) {
        categorized['Lifestyle'].push(memory.memory);
      } else {
        categorized['Other'].push(memory.memory);
      }
    }

    // Build the context string
    const sections: string[] = ['--- USER FITNESS PROFILE ---'];

    for (const [category, items] of Object.entries(categorized)) {
      if (items.length > 0) {
        sections.push(`\n${category}:`);
        items.forEach((item) => sections.push(`  - ${item}`));
      }
    }

    return sections.join('\n');
  }

  // ============================================
  // Profile Analysis Endpoints
  // ============================================

  /**
   * Get user's fitness profile analysis
   * Shows what information we have and what's missing
   */
  @Get('profile/:userId/analysis')
  async getProfileAnalysis(
    @Param('userId') userId: string,
  ): Promise<{
    success: boolean;
    profile: {
      totalMemories: number;
      completionPercentage: number;
      hasBasicInfo: boolean;
      hasGoals: boolean;
      hasCurrentFitness: boolean;
      hasInjuryInfo: boolean;
      hasDietInfo: boolean;
      hasLifestyleInfo: boolean;
      missingCategories: string[];
      suggestedQuestion?: string;
    };
  }> {
    if (!this.usersService.userExists(userId)) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      const memories = await this.mem0Service.getMemories(userId);
      const profileContext = this.buildFullProfileContext(memories);
      const analysis =
        this.chatGPTService.analyzeProfileCompleteness(profileContext);

      return {
        success: true,
        profile: {
          totalMemories: memories.length,
          ...analysis,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to analyze profile: ${error.message}`,
      );
    }
  }

  /**
   * Get onboarding prompt for new users
   */
  @Get('onboarding/prompt')
  getOnboardingPrompt(): { success: boolean; prompt: string } {
    return {
      success: true,
      prompt: this.chatGPTService.getOnboardingPrompt(),
    };
  }

  // ============================================
  // Project Configuration Endpoints (Pro Feature)
  // ============================================

  /**
   * Get current project settings
   */
  @Get('project/settings')
  async getProjectSettings(): Promise<{
    success: boolean;
    settings: any;
  }> {
    try {
      const settings = await this.mem0Service.getProjectSettings();
      return {
        success: true,
        settings,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get project settings: ${error.message}`,
      );
    }
  }

  /**
   * Update project custom instructions
   */
  @Put('project/instructions')
  async updateCustomInstructions(
    @Body('instructions') instructions: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!instructions) {
      throw new BadRequestException('instructions is required');
    }

    try {
      return await this.mem0Service.updateCustomInstructions(instructions);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Update project custom categories
   * Body: { categories: [{ category_name: "description" }, ...] }
   */
  @Put('project/categories')
  async updateCustomCategories(
    @Body('categories') categories: Array<Record<string, string>>,
  ): Promise<{ success: boolean; message: string }> {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      throw new BadRequestException(
        'categories must be a non-empty array of objects',
      );
    }

    try {
      return await this.mem0Service.updateCustomCategories(categories);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

}
