import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';
import { swaggerConfig } from '../src/config/swagger.config';

async function bootstrap() {
  // Create application context (no HTTP server started)
  const app = await NestFactory.create(AppModule, { logger: false });
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  
  const outputPath = 'swagger-spec.json';
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  
  console.log(`\n✅ OpenAPI specification successfully exported to ${outputPath}\n`);
  
  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Failed to generate Swagger spec:', err);
  process.exit(1);
});
