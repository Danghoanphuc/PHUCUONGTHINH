import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    this.enabled = !!(cloudName && apiKey && apiSecret);

    if (this.enabled) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.logger.log('✅ Cloudinary configured successfully');
    } else {
      this.logger.warn(
        '⚠️  Cloudinary not configured. Using local storage fallback.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // StorageService interface implementation
  async uploadFile(file: Buffer, folder: string = 'products'): Promise<string> {
    if (!this.enabled) {
      this.logger.error('❌ Cloudinary upload failed: not configured');
      this.logger.error('   Required env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
      throw new Error('Cloudinary is not configured');
    }

    this.logger.log(`⬆️ Uploading to Cloudinary: folder=${folder}, size=${file.length} bytes`);
    
    try {
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'auto', overwrite: true },
          (error, res) => {
            if (error) {
              this.logger.error('❌ Cloudinary upload error:', error);
              reject(error);
            } else if (res) {
              resolve(res);
            } else {
              reject(new Error('Upload failed: no result'));
            }
          },
        );
        stream.end(file);
      });

      this.logger.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      this.logger.error('❌ Cloudinary upload failed:', error);
      throw error;
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!this.enabled) throw new Error('Cloudinary is not configured');
    await cloudinary.uploader.destroy(publicId);
  }

  extractPublicId(url: string): string | null {
    if (!url?.includes('cloudinary.com')) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  }

  getOptimizedUrl(
    url: string,
    width?: number,
    height?: number,
    quality = 80,
  ): string {
    if (!url?.includes('cloudinary.com')) return url;
    const t = [
      ...(width ? [`w_${width}`] : []),
      ...(height ? [`h_${height}`] : []),
      `q_${quality}`,
      'f_auto',
    ].join(',');
    return url.replace('/upload/', `/upload/${t}/`);
  }

  generateS3Key(
    productId: string,
    filename: string,
    mediaType: string,
  ): string {
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `products/${productId}/${mediaType}/${Date.now()}_${sanitized}`;
  }

  getPublicUrl(key: string): string {
    if (key.startsWith('http')) return key;
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    return `https://res.cloudinary.com/${cloudName}/image/upload/${key}`;
  }
}
