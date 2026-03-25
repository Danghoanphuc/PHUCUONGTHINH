import { registerAs } from '@nestjs/config';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  validateSync,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  NODE_ENV: string = 'development';

  @IsNumber()
  @Min(1000)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3001;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string = '24h';

  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  AWS_S3_BUCKET_NAME?: string;

  @IsString()
  @IsNotEmpty()
  AWS_REGION: string = 'us-east-1';

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsString()
  CMS_URL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`Configuration validation failed: ${errorMessages}`);
  }

  return validatedConfig;
}

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3BucketName: process.env.AWS_S3_BUCKET_NAME || '',
    region: process.env.AWS_REGION || 'us-east-1',
  },
  cdn: {
    baseUrl: process.env.CDN_BASE_URL || '',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
    cmsUrl: process.env.CMS_URL || 'http://localhost:3002',
  },
}));
