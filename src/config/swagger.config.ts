import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Flutter App API')
  .setDescription('The backend API for our Flutter application')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
