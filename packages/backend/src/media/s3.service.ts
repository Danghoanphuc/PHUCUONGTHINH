import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');

    const r2Endpoint = this.configService.get('R2_ENDPOINT'); // https://<account_id>.r2.cloudflarestorage.com

    const config: any = {
      region: this.configService.get('AWS_REGION') || 'auto',
      ...(r2Endpoint && { endpoint: r2Endpoint }),
    };

    if (accessKeyId && secretAccessKey) {
      config.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    this.s3Client = new S3Client(config);
    this.bucketName =
      this.configService.get('AWS_S3_BUCKET_NAME') || 'default-bucket';
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  generateS3Key(
    productId: string,
    filename: string,
    mediaType: string,
  ): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `products/${productId}/${mediaType}/${timestamp}_${sanitizedFilename}`;
  }

  validateFileType(filename: string, mediaType: string): boolean {
    const fileExtension = filename.toLowerCase().split('.').pop();

    const allowedTypes = {
      lifestyle: ['jpg', 'jpeg', 'png', 'webp'],
      cutout: ['jpg', 'jpeg', 'png', 'webp'],
      video: ['mp4', 'webm'],
      '3d_file': ['dwg', 'obj', 'fbx', 'dae', 'blend'],
      pdf: ['pdf'],
    };

    return allowedTypes[mediaType]?.includes(fileExtension) || false;
  }

  validateFileSize(fileSize: number, mediaType: string): boolean {
    const maxSizes = {
      lifestyle: 10 * 1024 * 1024, // 10MB
      cutout: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      '3d_file': 50 * 1024 * 1024, // 50MB
      pdf: 20 * 1024 * 1024, // 20MB
    };

    return fileSize <= (maxSizes[mediaType] || 10 * 1024 * 1024);
  }

  getPublicUrl(key: string): string {
    const cdnDomain = this.configService.get('CDN_DOMAIN'); // R2 public domain hoặc custom domain
    if (cdnDomain) {
      return `https://${cdnDomain}/${key}`;
    }
    // fallback S3
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}
