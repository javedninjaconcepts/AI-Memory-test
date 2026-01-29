import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MemoryClient from 'mem0ai';
import {
  AddMemoryDto,
  AddMemoryFromTextDto,
  Mem0Options,
} from './dto/add-memory.dto';
import { SearchMemoryDto } from './dto/search-memory.dto';

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
}

/**
 * Default Mem0 options optimized for Fitness AI Assistant
 * 
 * PRICING NOTE - Features by tier:
 * ================================
 * FREE (Hobby):     Basic memory add/search/get
 * PRO ($249/mo):    + enable_graph, custom_categories, custom_instructions, includes, excludes
 * 
 * Set MEM0_PRO_TIER=true in .env to enable pro features
 */
export const FITNESS_MEM0_DEFAULTS: Mem0Options = {
  // Keep defaults minimal for free tier compatibility
  infer: true,
};

/**
 * Pro tier options - only applied if MEM0_PRO_TIER=true
 */
export const FITNESS_MEM0_PRO_OPTIONS: Mem0Options = {
  includes:
    'Extract personal details, food preferences, allergies, health information, exercise routines, fitness goals, body measurements, workout preferences, dietary restrictions, supplements, sleep patterns, injuries, and physical limitations',
  excludes:
    'Ignore casual conversation, opinions about apps, weather comments, greetings, small talk, and temporary complaints',
  customInstructions: `Extract and categorize fitness-related information:
1) Exercise preferences with intensity levels (light/moderate/intense)
2) Injuries or physical limitations with affected body parts
3) Fitness goals with timeframes if mentioned
4) Dietary patterns including meal timing and calorie targets
5) Body measurements (weight, height, body fat percentage)
6) Sleep and recovery patterns
7) Supplement and medication usage
Convert relative dates to absolute dates when possible.
Flag any mentioned allergies as high-priority memories.
Track progress metrics when user shares workout results.`,
  customCategories: {
    fitness_goals: 'Weight loss, muscle gain, endurance, flexibility goals',
    exercise_preferences: 'Preferred workouts, gym vs home, cardio vs strength',
    dietary_info: 'Food preferences, allergies, meal timing, calorie targets',
    body_metrics: 'Weight, height, body fat, measurements',
    injuries_limitations: 'Current injuries, past injuries, physical limitations',
    health_conditions: 'Medical conditions affecting fitness',
    supplements: 'Vitamins, protein, pre-workout, medications',
    sleep_recovery: 'Sleep patterns, rest days, recovery methods',
    workout_schedule: 'Training days, preferred times, frequency',
    progress_tracking: 'PRs, milestones, weight changes, measurements',
  },
  infer: true,
  enableGraph: true,
};

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
    if (mergedMem0Options.includes)
      options.includes = mergedMem0Options.includes;
    if (mergedMem0Options.excludes)
      options.excludes = mergedMem0Options.excludes;
    if (mergedMem0Options.customInstructions)
      options.custom_instructions = mergedMem0Options.customInstructions;
    if (mergedMem0Options.customCategories)
      options.custom_categories = mergedMem0Options.customCategories;
    if (mergedMem0Options.infer !== undefined)
      options.infer = mergedMem0Options.infer;
    if (mergedMem0Options.version) options.version = mergedMem0Options.version;
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
   * Search memories using semantic search
   * Only uses user_id for memory association and limited with 5 results curretntly commented out the session and agent id for now
   */
  async searchMemory(dto: SearchMemoryDto): Promise<SearchResult[]> {
    this.ensureClient();

    const options: Record<string, any> = {};

    if (dto.userId) options.user_id = dto.userId;
    // if (dto.sessionId) options.run_id = dto.sessionId;
    // if (dto.agentId) options.agent_id = dto.agentId;
    if (dto.limit) options.limit = dto.limit;

    const results = await this.client.search(dto.query, options);
    return results as SearchResult[];
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
}
