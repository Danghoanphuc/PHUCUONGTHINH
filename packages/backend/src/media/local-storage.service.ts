import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageService {
  private uploadDir: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.publicUrl =
      this.configService.get('BACKEND_URL') || 'http://localhost:3001';

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    // For local storage, return a marker URL that includes the key
    return `${this.publicUrl}/api/v1/media/upload/${encodeURIComponent(key)}`;
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    return this.getPublicUrl(key);
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
      showcase: ['jpg', 'jpeg', 'png', 'webp'],
      video: ['mp4', 'webm', 'mov'],
      '3d_file': ['dwg', 'obj', 'fbx', 'dae', 'blend', 'glb', 'gltf', 'skp'],
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
    return `${this.publicUrl}/uploads/${key}`;
  }

  async saveFile(key: string, buffer: Buffer): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
