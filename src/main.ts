import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for all origins
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  
  // Serve static files from the 'public' directory
  // Use process.cwd() to get project root (works in both dev and production)
  app.useStaticAssets(join(process.cwd(), 'public'));
  
  // Enable shutdown hooks
  app.enableShutdownHooks();
  
  // Use PORT from environment (Render sets this) or default to 4000 for local dev
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}

bootstrap();
