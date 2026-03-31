import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { GetPresignedUrlDto } from './dto/upload-media.dto';
import { CombinedFilterService } from '../products/services/combined-filter.service';
import { ProductsEventService } from '../products/products-events.service';

interface StorageService {
  getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<string>;
  getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  generateS3Key(productId: string, filename: string, mediaType: string): string;
  validateFileType(filename: string, mediaType: string): boolean;
  getPublicUrl(key: string): string;
}

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    @Inject('STORAGE_SERVICE') private storageService: StorageService,
    private combinedFilterService: CombinedFilterService,
    private eventsService: ProductsEventService,
  ) {}

  async create(createMediaDto: CreateMediaDto) {
    // Validate that the product exists
    const product = await this.prisma.product.findUnique({
      where: { id: createMediaDto.product_id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If this is being set as cover image, unset any existing cover image
    if (createMediaDto.is_cover) {
      await this.prisma.media.updateMany({
        where: {
          product_id: createMediaDto.product_id,
          is_cover: true,
        },
        data: { is_cover: false },
      });
    }

    // If no sort_order provided, set it to the next available position
    if (createMediaDto.sort_order === undefined) {
      const lastMedia = await this.prisma.media.findFirst({
        where: { product_id: createMediaDto.product_id },
        orderBy: { sort_order: 'desc' },
      });
      createMediaDto.sort_order = (lastMedia?.sort_order || 0) + 1;
    }

    const media = await this.prisma.media.create({
      data: createMediaDto,
    });
    this.combinedFilterService.clearProductCaches(createMediaDto.product_id);

    // Emit event for real-time updates
    this.eventsService.emit({
      type: 'updated',
      productId: createMediaDto.product_id,
    });

    return media;
  }

  async findAll() {
    return this.prisma.media.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: [{ product_id: 'asc' }, { sort_order: 'asc' }],
    });
  }

  async findByProductId(productId: string) {
    return this.prisma.media.findMany({
      where: { product_id: productId },
      orderBy: { sort_order: 'asc' },
    });
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async update(id: string, updateMediaDto: UpdateMediaDto) {
    const existingMedia = await this.findOne(id);

    // If setting as cover image, unset any existing cover image for the product
    if (updateMediaDto.is_cover) {
      await this.prisma.media.updateMany({
        where: {
          product_id: existingMedia.product_id,
          is_cover: true,
          id: { not: id },
        },
        data: { is_cover: false },
      });
    }

    const result = await this.prisma.media.update({
      where: { id },
      data: updateMediaDto,
    });
    this.combinedFilterService.clearProductCaches(existingMedia.product_id);

    // Emit event for real-time updates
    this.eventsService.emit({
      type: 'updated',
      productId: existingMedia.product_id,
    });

    return result;
  }

  async remove(id: string) {
    const media = await this.findOne(id);
    const result = await this.prisma.media.delete({ where: { id } });
    this.combinedFilterService.clearProductCaches(media.product_id);

    // Emit event for real-time updates
    this.eventsService.emit({
      type: 'updated',
      productId: media.product_id,
    });

    return result;
  }

  async getPresignedUploadUrl(
    productId: string,
    getPresignedUrlDto: GetPresignedUrlDto,
  ) {
    // Validate that the product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate file type
    if (
      !this.storageService.validateFileType(
        getPresignedUrlDto.filename,
        getPresignedUrlDto.media_type,
      )
    ) {
      throw new BadRequestException(
        `Invalid file type for media type ${getPresignedUrlDto.media_type}`,
      );
    }

    // Generate S3 key
    const s3Key = this.storageService.generateS3Key(
      productId,
      getPresignedUrlDto.filename,
      getPresignedUrlDto.media_type,
    );

    // Get presigned URL
    const uploadUrl = await this.storageService.getPresignedUploadUrl(
      s3Key,
      getPresignedUrlDto.content_type,
    );

    return {
      upload_url: uploadUrl,
      s3_key: s3Key,
      public_url: this.storageService.getPublicUrl(s3Key),
    };
  }

  async getDownloadUrl(id: string) {
    const media = await this.findOne(id);

    // Extract S3 key from file_url
    const s3Key = this.extractS3KeyFromUrl(media.file_url);

    const downloadUrl =
      await this.storageService.getPresignedDownloadUrl(s3Key);

    return {
      download_url: downloadUrl,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
    };
  }

  private extractS3KeyFromUrl(fileUrl: string): string {
    // Handle both CDN URLs and direct S3 URLs
    const url = new URL(fileUrl);
    return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  }

  async updateSortOrder(
    productId: string,
    mediaOrders: { id: string; sort_order: number }[],
  ) {
    // Validate that all media belong to the product
    const mediaIds = mediaOrders.map((m) => m.id);
    const existingMedia = await this.prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        product_id: productId,
      },
    });

    if (existingMedia.length !== mediaIds.length) {
      throw new BadRequestException(
        'Some media items do not belong to this product',
      );
    }

    // Update sort orders in a transaction
    const result = await this.prisma.$transaction(
      mediaOrders.map(({ id, sort_order }) =>
        this.prisma.media.update({
          where: { id },
          data: { sort_order },
        }),
      ),
    );
    this.combinedFilterService.clearProductCaches(productId);
    return result;
  }
}
