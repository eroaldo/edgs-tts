import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerPath = 'api-docs';
  app.use(`/${swaggerPath}`, (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Edge TTS API')
    .setDescription('REST API for Microsoft Edge Text-to-Speech synthesis')
    .setVersion('1.0')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, doc, {
    customSiteTitle: 'Edge TTS API',
    customfavIcon: 'https://uxwing.com/wp-content/themes/uxwing/download/web-app-development/api-icon.svg',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title small { display: none; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .swagger-ui .info .title { color: #1a202c; font-weight: 600; }
      .swagger-ui .scheme-container { background: #f7fafc; box-shadow: none; border-bottom: 1px solid #e2e8f0; }
      .swagger-ui .opblock.opblock-post { background: #ebf8ff; border-color: #3182ce; }
      .swagger-ui .opblock.opblock-get { background: #f0fff4; border-color: #38a169; }
    `,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Edge TTS API running on port ${port}`, 'Bootstrap');
}
bootstrap();
