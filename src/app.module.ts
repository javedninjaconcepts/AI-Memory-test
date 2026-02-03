import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGPTService } from './chatgpt.service';
import { UsersModule } from './users/users.module';
import { Mem0Module } from './mem0/mem0.module';
import { MemoryModule } from './memory/memory.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        // Use DATABASE_URL if available (Render), otherwise use individual vars (local)
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User],
            migrations: [__dirname + '/migrations/*.js'],
            migrationsRun: false, // Migrations run via CLI in build step
            synchronize: !isProduction, // Auto-sync in dev, not in production
            logging: !isProduction,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'nestjs_chatgpt'),
          entities: [User],
          migrations: [__dirname + '/migrations/*.js'],
          migrationsRun: false, // Migrations run via CLI
          synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
          logging: configService.get<boolean>('DB_LOGGING', false),
        };
      },
    }),
    UsersModule,
    Mem0Module,
    MemoryModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGPTService],
})
export class AppModule {}
