import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import type { Product } from '@prisma/client';
import { CombinedFilterService } from './services/combined-filter.service';
import { ProductsEventService } from './products-events.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private categoriesService: CategoriesService,
    private combinedFilterService: CombinedFilterService,
    private eventsService: ProductsEventService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const {
      name,
      sku,
      description,
      category_id,
      technical_specs,
      style_ids,
      space_ids,
    } = createProductDto;

    // Validate category exists
    await this.categoriesService.findOne(category_id);

    // Check SKU uniqueness
    const existingSku = await this.prisma.product.findUnique({
      where: { sku },
    });
    if (existingSku) {
      throw new BadRequestException('SKU already exists');
    }

    // Validate style and space IDs if provided
    if (style_ids && style_ids.length > 0) {
      const styles = await this.prisma.style.findMany({
        where: { id: { in: style_ids } },
      });
      if (styles.length !== style_ids.length) {
        throw new BadRequestException('One or more style IDs are invalid');
      }
    }

    if (space_ids && space_ids.length > 0) {
      const spaces = await this.prisma.space.findMany({
        where: { id: { in: space_ids } },
      });
      if (spaces.length !== space_ids.length) {
        throw new BadRequestException('One or more space IDs are invalid');
      }
    }

    // Create product with relationships
    const product = await this.prisma.product.create({
      data: {
        name,
        sku,
        description,
        category_id,
        technical_specs: JSON.stringify(technical_specs ?? {}), // Always a valid JSON string
        style_tags:
          style_ids && style_ids.length > 0
            ? {
                create: style_ids.map((style_id) => ({ style_id })),
              }
            : undefined,
        space_tags:
          space_ids && space_ids.length > 0
            ? {
                create: space_ids.map((space_id) => ({ space_id })),
              }
            : undefined,
      },
      include: {
        category: true,
        style_tags: {
          include: {
            style: true,
          },
        },
        space_tags: {
          include: {
            space: true,
          },
        },
        media: true,
      },
    });

    this.combinedFilterService.clearProductCaches();
    this.eventsService.emit({
      type: 'created',
      productId: product.id,
      timestamp: new Date().toISOString(),
    });
    return product;
  }

  async findAll(filters?: ProductFiltersDto) {
    const {
      categories,
      styles,
      spaces,
      technical_specs,
      search,
      page = 1,
      limit = 20,
      published = 'true',
    } = filters || {};

    // Convert old filter format to new combined filter format
    const combinedFilters = {
      categories,
      search,
      published,
      page,
      limit,
      inspiration: {
        styles,
        spaces,
      },
      technical: technical_specs,
    };

    return this.combinedFilterService.filterProducts(combinedFilters);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        style_tags: {
          include: {
            style: true,
          },
        },
        space_tags: {
          include: {
            space: true,
          },
        },
        media: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Add cache-busting timestamp to media URLs to force browser reload
    const mediaWithTimestamp = product.media?.map((m) => ({
      ...m,
      file_url: m.file_url.includes('?')
        ? m.file_url
        : `${m.file_url}?v=${m.updated_at?.getTime() || Date.now()}`,
    }));

    // Parse technical_specs back to object
    return {
      ...product,
      technical_specs: JSON.parse(product.technical_specs),
      media: mediaWithTimestamp,
    } as any;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        category: true,
        style_tags: {
          include: {
            style: true,
          },
        },
        space_tags: {
          include: {
            space: true,
          },
        },
        media: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Parse technical_specs back to object
    return {
      ...product,
      technical_specs: JSON.parse(product.technical_specs),
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    // Fetch existing product with relations for comparison
    const existingProductWithRelations = await this.prisma.product.findUnique({
      where: { id },
      include: {
        style_tags: true,
        space_tags: true,
      },
    });

    if (!existingProductWithRelations) {
      throw new NotFoundException('Product not found');
    }

    const {
      name,
      sku,
      description,
      category_id,
      technical_specs,
      style_ids,
      space_ids,
      is_published,
    } = updateProductDto;

    // Run all validations in parallel for better performance
    const validationPromises: Promise<any>[] = [];

    // Validate category if provided
    if (category_id) {
      validationPromises.push(this.categoriesService.findOne(category_id));
    }

    // Check SKU uniqueness if changed
    if (sku && sku !== existingProductWithRelations.sku) {
      validationPromises.push(
        this.prisma.product
          .findUnique({ where: { sku } })
          .then((existingSku) => {
            if (existingSku) {
              throw new BadRequestException('SKU already exists');
            }
          }),
      );
    }

    // Validate style IDs if provided
    if (style_ids && style_ids.length > 0) {
      validationPromises.push(
        this.prisma.style
          .findMany({ where: { id: { in: style_ids } } })
          .then((styles) => {
            if (styles.length !== style_ids.length) {
              throw new BadRequestException(
                'One or more style IDs are invalid',
              );
            }
          }),
      );
    }

    // Validate space IDs if provided
    if (space_ids && space_ids.length > 0) {
      validationPromises.push(
        this.prisma.space
          .findMany({ where: { id: { in: space_ids } } })
          .then((spaces) => {
            if (spaces.length !== space_ids.length) {
              throw new BadRequestException(
                'One or more space IDs are invalid',
              );
            }
          }),
      );
    }

    // Wait for all validations to complete
    await Promise.all(validationPromises);

    // Smart update: Only touch tags if they actually changed
    const updateData: any = {
      ...(name && { name }),
      ...(sku && { sku }),
      ...(description !== undefined && { description }),
      ...(category_id && { category_id }),
      ...(technical_specs && {
        technical_specs: JSON.stringify(technical_specs),
      }),
      ...(is_published !== undefined && { is_published }),
    };

    // Smart tag update: Only update if tags actually changed
    if (style_ids !== undefined) {
      const currentStyleIds = existingProductWithRelations.style_tags
        .map((t) => t.style_id)
        .sort();
      const newStyleIds = [...style_ids].sort();
      const tagsChanged =
        currentStyleIds.length !== newStyleIds.length ||
        currentStyleIds.some((id, i) => id !== newStyleIds[i]);

      if (tagsChanged) {
        updateData.style_tags = {
          deleteMany: {},
          create: style_ids.map((style_id) => ({ style_id })),
        };
      }
    }

    // Smart tag update: Only update if tags actually changed
    if (space_ids !== undefined) {
      const currentSpaceIds = existingProductWithRelations.space_tags
        .map((t) => t.space_id)
        .sort();
      const newSpaceIds = [...space_ids].sort();
      const tagsChanged =
        currentSpaceIds.length !== newSpaceIds.length ||
        currentSpaceIds.some((id, i) => id !== newSpaceIds[i]);

      if (tagsChanged) {
        updateData.space_tags = {
          deleteMany: {},
          create: space_ids.map((space_id) => ({ space_id })),
        };
      }
    }

    // Update product with relationships
    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        style_tags: {
          include: {
            style: true,
          },
        },
        space_tags: {
          include: {
            space: true,
          },
        },
        media: true,
      },
    });

    this.combinedFilterService.clearProductCaches(id);
    this.eventsService.emit({
      type: 'updated',
      productId: id,
      timestamp: new Date().toISOString(),
    });
    return product;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Ensure product exists

    await this.prisma.product.delete({
      where: { id },
    });

    this.combinedFilterService.clearProductCaches(id);
    this.eventsService.emit({
      type: 'deleted',
      productId: id,
      timestamp: new Date().toISOString(),
    });
  }

  async publish(id: string): Promise<Product> {
    const product = await this.findOne(id);

    // Validate publication requirements
    if (!product.name || !product.category_id) {
      throw new BadRequestException(
        'Product must have name and category before publishing',
      );
    }

    // Check if product has at least one media asset
    const mediaCount = await this.prisma.media.count({
      where: { product_id: id },
    });

    if (mediaCount === 0) {
      throw new BadRequestException(
        'Product must have at least one media asset before publishing',
      );
    }

    return this.update(id, { is_published: true });
  }

  async unpublish(id: string): Promise<Product> {
    return this.update(id, { is_published: false });
  }

  // TODO: Implement proper Golden Record construction in task 6
  async getGoldenRecord(id: string): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        style_tags: {
          include: {
            style: true,
          },
        },
        space_tags: {
          include: {
            space: true,
          },
        },
        media: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Temporary implementation - return basic product data
    // This will be replaced with proper Golden Record construction in task 6
    return {
      product_id: product.id,
      sku: product.sku,
      identification: {
        name: product.name,
        description: product.description,
        category: product.category?.name,
      },
      technical_data: JSON.parse(product.technical_specs || '{}'),
      marketing_content: {},
      digital_assets: {},
      relational_data: {},
      ai_semantic_layer: {},
      erp_sync_data: {},
    };
  }

  // TODO: Implement proper Golden Record construction in task 6
  async getGoldenRecordBySku(sku: string): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        category: true,
        style_tags: {
          include: {
            style: true,
          },
        },
        space_tags: {
          include: {
            space: true,
          },
        },
        media: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Temporary implementation - return basic product data
    // This will be replaced with proper Golden Record construction in task 6
    return {
      product_id: product.id,
      sku: product.sku,
      identification: {
        name: product.name,
        description: product.description,
        category: product.category?.name,
      },
      technical_data: JSON.parse(product.technical_specs || '{}'),
      marketing_content: {},
      digital_assets: {},
      relational_data: {},
      ai_semantic_layer: {},
      erp_sync_data: {},
    };
  }
}
