import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';
import { SecurityHeadersService } from './common/services/security-headers.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn'] // Only errors and warnings in production
        : ['log', 'error', 'warn', 'debug', 'verbose'], // All logs in development
  });
  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);
  const securityHeadersService = app.get(SecurityHeadersService);

  // Increase body size limit for file uploads
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  // CORS phải đặt trước static assets để header được apply cho cả /uploads/
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control', 'Pragma', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Cache-Control'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Handle OPTIONS preflight explicitly (needed when behind Cloudflare)
  app.use((req: any, res: any, next: any) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,DELETE,PATCH,OPTIONS',
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type,Authorization,Accept,Cache-Control,Pragma,X-Requested-With',
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // cache preflight 24h
      return res.status(204).send();
    }
    next();
  });

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  // Apply security headers middleware
  app.use((req, res, next) => {
    const headers = securityHeadersService.getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Disable Cloudflare/CDN caching for all API responses
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');

    // SSE endpoint: disable buffering (critical for Cloudflare/nginx)
    if (req.path.includes('/events')) {
      res.setHeader('X-Accel-Buffering', 'no');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    next();
  });

  // Enable global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Set global API prefix, exclude root path
  app.setGlobalPrefix('api/v1', { exclude: ['/', 'favicon.ico'] });

  const port = configService.get<number>('app.port') || 3001;
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
  const frontendUrl =
    configService.get<string>('app.frontend.url') || 'http://localhost:3001';
  const cmsUrl =
    configService.get<string>('app.frontend.cmsUrl') || 'http://localhost:3002';

  await app.listen(port);

  if (process.env.NODE_ENV !== 'production') {
    loggerService.log(`Application started on port ${port}`, {
      environment: nodeEnv,
      timestamp: new Date().toISOString(),
      frontendUrl,
      cmsUrl,
    });
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
