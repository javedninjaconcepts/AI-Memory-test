import { Module } from '@nestjs/common';
import { MemoryController } from './memory.controller';
import { Mem0Module } from '../mem0/mem0.module';
import { UsersModule } from '../users/users.module';
import { ChatGPTService } from '../chatgpt.service';

@Module({
  imports: [Mem0Module, UsersModule],
  controllers: [MemoryController],
  providers: [ChatGPTService],
})
export class MemoryModule {}
