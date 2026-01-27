import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ChatGPTService } from './chatgpt.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly chatGPTService: ChatGPTService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('chat')
  async chat(@Body('message') message: string) {
    if (!message) {
      return { error: 'Message is required' };
    }

    try {
      const response = await this.chatGPTService.chat(message);
      return { 
        success: true,
        message: message,
        response: response 
      };
    } catch (error) {
      return { 
        success: false,
        error: error.message 
      };
    }
  }
}
