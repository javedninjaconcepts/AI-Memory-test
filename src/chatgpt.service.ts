import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ChatGPTService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in .env file');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Send a message to ChatGPT and get a response
   * @param message - The user's message
   * @returns The AI's response
   */
  async chat(message: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
        max_tokens: 500,
        temperature: 0.7,
      });
      // console.log(response.choices[0]?.message?.content || 'No response from AI');

      return response.choices[0]?.message?.content || 'No response from AI';
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Send a message to ChatGPT with memory context
   * @param message - The user's message
   * @param context - Memory context to include in the conversation
   * @returns The AI's response
   */
  async chatWithContext(message: string, context: string): Promise<string> {
    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

      // Add memory context as system message if available
      if (context) {
        messages.push({ role: 'system', content: context });
      }

      // Add the user's message
      messages.push({ role: 'user', content: message });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'No response from AI';
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}
