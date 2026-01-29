import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGPTService } from './chatgpt.service';
import { UsersModule } from './users/users.module';
import { Mem0Module } from './mem0/mem0.module';
import { MemoryModule } from './memory/memory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UsersModule,
    Mem0Module,
    MemoryModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGPTService],
})
export class AppModule {}
