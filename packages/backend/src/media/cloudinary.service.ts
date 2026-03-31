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

  /**
   * Upload file to Cloudinary
   * @param file Buffer or file path
   * @param folder Cloudinary folder (e.g., 'products')
   * @param publicId Optional custom public ID
   * @returns Cloudinary URL
   */
  async uploadFile(
    file: Buffer | string,
    folder: string = 'products',
    publicId?: string,
  ): Promise<string> {
    if (!this.enabled) {
      throw new Error('Cloudinary is not configured');
    }

    try {
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: 'auto', // Auto-detect image/video/raw
            overwrite: true,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Upload failed: no result'));
            }
          },
        );

        if (Buffer.isBuffer(file)) {
          uploadStream.end(file);
        } else {
          // If file is a path, use upload instead
          cloudinary.uploader
            .upload(file, {
              folder,
              public_id: publicId,
              resource_type: 'auto',
              overwrite: true,
            })
            .then((res) => {
              if (res) resolve(res);
              else reject(new Error('Upload failed: no result'));
            })
            .catch(reject);
        }
      });

      this.logger.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      this.logger.error('❌ Failed to upload to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Delete file from Cloudinary
   * @param publicId Cloudinary public ID (e.g., 'products/abc123')
   */
  async deleteFile(publicId: string): Promise<void> {
    if (!this.enabled) {
      throw new Error('Cloudinary is not configured');
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`✅ Deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.error('❌ Failed to delete from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Extract Cloudinary public ID from URL
   * @param url Cloudinary URL
   * @returns Public ID or null
   */
  extractPublicId(url: string): string | null {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    try {
      // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/products/abc123.jpg
      // Extract: products/abc123
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Generate transformation URL for image optimization
   * @param url Original Cloudinary URL
   * @param width Target width
   * @param height Target height
   * @param quality Quality (1-100)
   * @returns Transformed URL
   */
  getOptimizedUrl(
    url: string,
    width?: number,
    height?: number,
    quality: number = 80,
  ): string {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }

    try {
      // Insert transformation parameters
      const transformations: string[] = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      transformations.push(`q_${quality}`);
      transformations.push('f_auto'); // Auto format (WebP, AVIF, etc.)

      const transform = transformations.join(',');
      return url.replace('/upload/', `/upload/${transform}/`);
    } catch {
      return url;
    }
  }

  /**
   * Validate file type for upload
   */
  validateFileType(filename: string, mediaType: string): boolean {
    const fileExtension = filename.toLowerCase().split('.').pop();

    const allowedTypes = {
      lifestyle: ['jpg', 'jpeg', 'png', 'webp'],
      cutout: ['jpg', 'jpeg', 'png', 'webp'],
      showcase: ['jpg', 'jpeg', 'png', 'webp'],
      video: ['mp4', 'webm', 'mov'],
      '3d_file': ['dwg', 'obj', 'fbx', 'dae', 'blend', 'glb', 'gltf', 'skp'],
      pdf: ['pdf'],
    };

    return allowedTypes[mediaType]?.includes(fileExtension) || false;
  }

  /**
   * Generate S3-compatible key for Cloudinary
   */
  generateS3Key(
    productId: string,
    filename: string,
    mediaType: string,
  ): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `products/${productId}/${mediaType}/${timestamp}_${sanitizedFilename}`;
  }

  /**
   * Get presigned upload URL (not used with Cloudinary, but required by interface)
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    // Cloudinary doesn't use presigned URLs, return a placeholder
    return `cloudinary://upload/${key}`;
  }

  /**
   * Get presigned download URL (returns public URL)
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    return this.getPublicUrl(key);
  }

  /**
   * Get public URL for a Cloudinary asset
   */
  getPublicUrl(key: string): string {
    // If already a full URL, return as-is
    if (key.startsWith('http')) {
      return key;
    }
    // Otherwise construct Cloudinary URL
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    return `https://res.cloudinary.com/${cloudName}/image/upload/${key}`;
  }
}
