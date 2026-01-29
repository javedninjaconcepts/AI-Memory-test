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
import { Mem0Service, SearchResult, MemoryResult } from '../mem0/mem0.service';
import { ChatGPTService } from '../chatgpt.service';
import { UsersService } from '../users/users.service';
import { ChatWithMemoryDto } from './dto/chat-with-memory.dto';

interface ChatResponse {
  success: boolean;
  message: string;
  response: string;
  memoriesUsed: string[];
  newMemoriesCreated: number;
  // sessionId?: string;
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
   * Only uses user_id for memory association
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

    // Generate session ID if not provided
    // const sessionId =
    //   dto.sessionId || this.usersService.generateSessionId(dto.userId);

    try {
      // Step 1: Search for relevant memories by user_id only
      const searchResults = await this.mem0Service.searchMemory({
        query: dto.message,
        userId: dto.userId,
        limit: 10, // Fetch more to filter by score
      });

      // Step 2: Filter by score > 0.5 and get top 3 highest scores
      console.log('Memory search scores:', searchResults.map(m => m.score));
      const relevantMemories = searchResults
        .filter((m) => m.score > .35)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      // Step 3: Build context from memories
      const memoryContext = this.buildMemoryContext(relevantMemories);
      const memoriesUsed = relevantMemories.map((m) => m.memory);

      // Step 4: Get AI response with memory context
      const aiResponse = await this.chatGPTService.chatWithContext(
        dto.message,
        memoryContext,
      );

      // Step 5: Store the conversation in memory by user_id only
      const memoryResult = await this.mem0Service.addMemory({
        messages: [
          { role: 'user', content: dto.message },
          { role: 'assistant', content: aiResponse },
        ],
        userId: dto.userId,
        // sessionId: sessionId,
        // agentId: dto.agentId,
      });

      return {
        success: true,
        message: dto.message,
        response: aiResponse,
        memoriesUsed,
        newMemoriesCreated: memoryResult.results?.length || 0,
        // sessionId,
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
   * Semantic search across memories
   * Only uses user_id for memory association
   */
  @Get('search')
  async searchMemories(
    @Query('q') query: string,
    @Query('userId') userId: string,
    // @Query('agentId') agentId?: string,
    @Query('limit') limit?: string,
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
        // agentId,
        limit: limit ? parseInt(limit, 10) : 10,
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
}
