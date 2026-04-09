import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from '../../categories/categories.service';
import {
  InspirationFilterService,
  InspirationFilters,
} from './inspiration-filter.service';
import {
  TechnicalFilterService,
  TechnicalFilters,
} from './technical-filter.service';
import { SearchService } from './search.service';
import { PaginationService } from './pagination.service';
import { CacheService } from './cache.service';
import { PerformanceService } from './performance.service';

export interface CombinedFilters {
  // Base filters
  categories?: string[];
  search?: string;
  published?: 'true' | 'false' | 'all';

  // Inspiration filters
  inspiration?: InspirationFilters;

  // Technical filters
  technical?: TechnicalFilters;

  // Pagination
  page?: number;
  limit?: number;
}

export interface FilterResponse {
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  available_filters: {
    inspiration: {
      styles: any[];
      spaces: any[];
    };
    technical: Record<string, any[]>;
    categories: any[];
  };
}

@Injectable()
export class CombinedFilterService {
  constructor(
    private prisma: PrismaService,
    private categoriesService: CategoriesService,
    private inspirationFilterService: InspirationFilterService,
    private technicalFilterService: TechnicalFilterService,
    private searchService: SearchService,
    private paginationService: PaginationService,
    private cacheService: CacheService,
    private performanceService: PerformanceService,
  ) {}

  async filterProducts(filters: CombinedFilters): Promise<FilterResponse> {
    // Extract cache buster parameter from frontend
    const { _t, ...actualFilters } = filters as any;
    const bustCache = !!_t; // If _t exists, bypass cache

    const {
      categories,
      search,
      published = 'true',
      inspiration,
      technical,
      page = 1,
      limit = 20,
    } = actualFilters;

    // Use search service if search query is provided
    if (search && search.trim().length > 0) {
      const searchResult = await this.searchService.searchWithFilters(
        search,
        inspiration,
        technical,
        { categories, published },
        { page, limit },
      );

      const availableFilters = await this.getAvailableFiltersCached();
      return { ...searchResult, available_filters: availableFilters };
    }

    const skip = (page - 1) * limit;

    // Build base where clause
    const baseWhere: any = {};

    // Published filter
    if (published === 'true') {
      baseWhere.is_published = true;
    } else if (published === 'false') {
      baseWhere.is_published = false;
    }

    // Category filter (including hierarchy) - Optimized with findMultipleHierarchies
    if (categories && categories.length > 0) {
      const categoryHierarchy =
        await this.categoriesService.findMultipleHierarchies(categories);
      baseWhere.category_id = { in: categoryHierarchy.map((c) => c.id) };
    }

    // Combine all where conditions
    const whereConditions: any[] = [];
    if (Object.keys(baseWhere).length > 0) whereConditions.push(baseWhere);

    // Add inspiration filters
    if (inspiration) {
      const inspirationWhere =
        this.inspirationFilterService.buildInspirationWhere(inspiration);
      if (Object.keys(inspirationWhere).length > 0) {
        whereConditions.push(inspirationWhere);
      }
    }

    // Add technical filters
    if (technical) {
      if (!this.technicalFilterService.validateTechnicalFilters(technical)) {
        throw new Error('Invalid technical filters');
      }
      const technicalWhere =
        this.technicalFilterService.buildTechnicalWhere(technical);
      if (Object.keys(technicalWhere).length > 0) {
        whereConditions.push(technicalWhere);
      }
    }

    const finalWhere =
      whereConditions.length > 0
        ? whereConditions.length === 1
          ? whereConditions[0]
          : { AND: whereConditions }
        : {};

    // Try cache only if not busting cache
    const cacheKey = this.cacheService.generateFilterCacheKey(actualFilters);
    if (!bustCache) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) return cached as FilterResponse;
    }

    // Execute queries with optimized select
    const [products, total, availableFilters] = await Promise.all([
      this.prisma.product.findMany({
        where: finalWhere,
        select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          category_id: true,
          technical_specs: true,
          is_published: true,
          created_at: true,
          updated_at: true,
          category: { select: { id: true, name: true, slug: true } },
          style_tags: {
            select: { style: { select: { id: true, name: true } } },
          },
          space_tags: {
            select: { space: { select: { id: true, name: true } } },
          },
          media: {
            select: {
              id: true,
              file_url: true,
              file_type: true,
              media_type: true,
              sort_order: true,
              is_cover: true,
              alt_text: true,
            },
            orderBy: { sort_order: 'asc' },
          },
        },
        orderBy: [{ is_published: 'desc' }, { created_at: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: finalWhere }),
      this.getAvailableFiltersCached(),
    ]);

    // Parse technical_specs back to objects (optimized)
    const productsWithParsedSpecs = products.map((product) => ({
      ...product,
      technical_specs: this.parseJsonSafely(product.technical_specs),
      // Removed redundant cache-busting timestamp from media URLs
    }));

    const result = {
      products: productsWithParsedSpecs,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
      available_filters: availableFilters,
    };

    await this.cacheService.set(cacheKey, result, { ttl: 300 });
    return result;
  }

  private async getAvailableFilters(baseWhere: any = {}) {
    const [inspirationFilters, technicalFilters, categories] =
      await Promise.all([
        this.inspirationFilterService.getAvailableFilters(),
        this.technicalFilterService.getAvailableTechnicalFilters(baseWhere),
        this.categoriesService.findAll(),
      ]);

    return {
      inspiration: inspirationFilters,
      technical: {
        ...technicalFilters,
        ...this.technicalFilterService.getCommonTechnicalFields(),
      },
      categories,
    };
  }

  private async getAvailableFiltersCached() {
    return this.cacheService.cached(
      'available_filters_all',
      () => this.getAvailableFilters({}),
      { ttl: 600 },
    );
  }

  /**
   * Clear product-related caches including filter lists and available_filters
   */
  clearProductCaches(productId?: string): number {
    let count = this.cacheService.invalidateProductCache(productId);
    // Xóa thêm key cụ thể của available_filters cache
    if (this.cacheService.delete('available_filters_all')) count++;
    return count;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }

  private parseJsonSafely(jsonString: string): any {
    if (!jsonString) return {};
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  }

  async getSearchSuggestions(query: string, limit: number = 10) {
    return this.searchService.getSearchSuggestions(query, limit);
  }

  async getPopularSearchTerms(limit: number = 10) {
    return this.searchService.getPopularSearchTerms(limit);
  }

  async getFilterStatistics() {
    const [totalProducts, publishedProducts, categories] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { is_published: true } }),
      this.categoriesService.findAll(),
    ]);

    return {
      total_products: totalProducts,
      published_products: publishedProducts,
      unpublished_products: totalProducts - publishedProducts,
      category_distribution: categories.map((cat: any) => ({
        category: cat.name,
        count: cat._count.products,
      })),
    };
  }
}
