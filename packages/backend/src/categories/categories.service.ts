import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import type { Category } from '@prisma/client';

@Injectable()
export class CategoriesService {
  private categoryCache: Category[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Clear local category cache
   */
  private clearCache() {
    this.categoryCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Generate a URL-friendly slug from category name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Ensure slug is unique by appending number if needed
   */
  private async ensureUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.category.findFirst({
        where: {
          slug,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, slug: providedSlug, parent_id } = createCategoryDto;

    // Validate parent exists if provided and not empty
    if (parent_id && parent_id.trim() !== '') {
      const parent = await this.prisma.category.findUnique({
        where: { id: parent_id },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    // Generate unique slug
    const baseSlug = providedSlug || this.generateSlug(name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const result = await this.prisma.category.create({
      data: {
        name,
        slug,
        parent_id: parent_id && parent_id.trim() !== '' ? parent_id : null,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    this.clearCache();
    return result;
  }

  async findAll(): Promise<Category[]> {
    const now = Date.now();
    if (this.categoryCache && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.categoryCache;
    }

    const categories = await this.prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    this.categoryCache = categories;
    this.cacheTimestamp = now;
    return categories;
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Get all categories in a hierarchy (category and all its subcategories)
   * Optimized to fetch all categories once and build tree in memory
   */
  async findHierarchy(id: string): Promise<Category[]> {
    const allCategories = await this.findAll();
    const category = allCategories.find((cat) => cat.id === id);
    if (!category) throw new NotFoundException('Category not found');

    const result: Category[] = [category];
    const queue = [id];

    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = allCategories.filter(
        (cat) => cat.parent_id === currentId,
      );
      for (const child of children) {
        result.push(child);
        queue.push(child.id);
      }
    }

    return result;
  }

  /**
   * Get multiple hierarchies in one go
   */
  async findMultipleHierarchies(ids: string[]): Promise<Category[]> {
    const allCategories = await this.findAll();
    const resultIds = new Set<string>();
    const queue = [...ids];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (resultIds.has(currentId)) continue;

      const category = allCategories.find((cat) => cat.id === currentId);
      if (category) {
        resultIds.add(currentId);
        const children = allCategories.filter(
          (cat) => cat.parent_id === currentId,
        );
        queue.push(...children.map((c) => c.id));
      }
    }

    return allCategories.filter((cat) => resultIds.has(cat.id));
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const existingCategory = await this.findOne(id);
    const { name, parent_id } = updateCategoryDto;

    // Validate parent exists if provided and is not the same category
    if (parent_id) {
      if (parent_id === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: parent_id },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }

      // Check for circular reference
      const hierarchy = await this.findHierarchy(id);
      const descendantIds = hierarchy.map((cat) => cat.id);
      if (descendantIds.includes(parent_id)) {
        throw new BadRequestException(
          'Cannot create circular reference in category hierarchy',
        );
      }
    }

    // Generate new slug if name changed
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      const baseSlug = this.generateSlug(name);
      slug = await this.ensureUniqueSlug(baseSlug, id);
    }

    const result = await this.prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(name && { slug }),
        ...(parent_id !== undefined && {
          parent_id: parent_id && parent_id.trim() !== '' ? parent_id : null,
        }),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    this.clearCache();
    return result;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Check if category has products
    const productCount = await this.prisma.product.count({
      where: { category_id: id },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${productCount} assigned products. Please reassign products first.`,
      );
    }

    // Check if category has children
    const childrenCount = await this.prisma.category.count({
      where: { parent_id: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories. Please delete or reassign subcategories first.',
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }
}
