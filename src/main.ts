import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all origins
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  
  // Enable shutdown hooks
  app.enableShutdownHooks();
  
  // Use PORT from environment (Render sets this) or default to 4000 for local dev
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}

bootstrap();
