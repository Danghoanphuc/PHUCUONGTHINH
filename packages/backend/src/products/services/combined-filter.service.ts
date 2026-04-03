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
    const {
      categories,
      search,
      published = 'true',
      inspiration,
      technical,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Build base where clause
    const baseWhere: any = {};

    // Published filter
    if (published === 'true') {
      baseWhere.is_published = true;
    } else if (published === 'false') {
      baseWhere.is_published = false;
    }

    // Category filter (including hierarchy)
    if (categories && categories.length > 0) {
      const categoryIds = new Set<string>();

      for (const categoryId of categories) {
        try {
          const hierarchy =
            await this.categoriesService.findHierarchy(categoryId);
          hierarchy.forEach((cat) => categoryIds.add(cat.id));
        } catch {
          // If category not found, just add the original ID
          categoryIds.add(categoryId);
        }
      }

      baseWhere.category_id = { in: Array.from(categoryIds) };
    }

    // Search filter
    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Combine all where conditions
    const whereConditions: any[] = [];

    // Add base conditions
    if (Object.keys(baseWhere).length > 0) {
      whereConditions.push(baseWhere);
    }

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
      // Validate technical filters first
      if (!this.technicalFilterService.validateTechnicalFilters(technical)) {
        throw new Error('Invalid technical filters');
      }

      const technicalWhere =
        this.technicalFilterService.buildTechnicalWhere(technical);
      if (Object.keys(technicalWhere).length > 0) {
        whereConditions.push(technicalWhere);
      }
    }

    // Final where clause
    const finalWhere =
      whereConditions.length > 0
        ? whereConditions.length === 1
          ? whereConditions[0]
          : { AND: whereConditions }
        : {};

    // Try cache first
    const cacheKey = `products:${JSON.stringify(finalWhere)}:${page}:${limit}`;

    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached as FilterResponse;
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
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          style_tags: {
            select: {
              style: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          space_tags: {
            select: {
              space: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
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
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
        orderBy: [{ is_published: 'desc' }, { created_at: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: finalWhere }),
      this.getAvailableFilters(baseWhere),
    ]);

    // Parse technical_specs back to objects
    const productsWithParsedSpecs = products.map((product) => ({
      ...product,
      technical_specs: this.parseJsonSafely(product.technical_specs),
      // Add cache-busting timestamp to media URLs
      media: product.media?.map((m) => ({
        ...m,
        file_url: m.file_url.includes('?')
          ? m.file_url
          : `${m.file_url}?v=${Date.now()}`,
      })),
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

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, { ttl: 300 });

    return result;
  }

  private async getAvailableFilters(baseWhere: any = {}) {
    const [inspirationFilters, technicalFilters, categories] =
      await Promise.all([
        this.inspirationFilterService.getAvailableFilters(),
        this.technicalFilterService.getAvailableTechnicalFilters(baseWhere),
        this.prisma.category.findMany({
          orderBy: { name: 'asc' },
        }),
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
      'available_filters',
      () => this.getAvailableFilters({}),
      { ttl: 600 }, // 10 minutes cache
    );
  }

  /**
   * Enhanced filtering with caching and performance optimization
   */
  async filterProductsOptimized(
    filters: CombinedFilters,
  ): Promise<FilterResponse> {
    const {
      categories,
      search,
      published = 'true',
      inspiration,
      technical,
      page = 1,
      limit = 20,
    } = filters;

    // Validate pagination parameters
    const paginationValidation =
      this.paginationService.validatePaginationOptions({ page, limit });
    if (!paginationValidation.isValid) {
      throw new Error(
        `Invalid pagination: ${paginationValidation.errors.join(', ')}`,
      );
    }

    // Generate cache key
    const cacheKey = this.cacheService.generateFilterCacheKey(filters);

    // Try to get from cache first
    const cachedResult = this.cacheService.get<FilterResponse>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Build optimized query
    const queryConfig =
      this.performanceService.buildOptimizedProductQuery(filters);
    const pagination = this.paginationService.calculatePagination(0, {
      page,
      limit,
    });

    // Execute query with performance monitoring
    const result = await this.performanceService.monitorQuery(
      'filterProducts',
      async () => {
        const [products, total] = await Promise.all([
          this.prisma.product.findMany({
            where: queryConfig.where,
            include: queryConfig.include,
            orderBy: queryConfig.orderBy,
            skip: pagination.offset,
            take: pagination.limit,
          }),
          this.prisma.product.count({ where: queryConfig.where }),
        ]);

        return { products, total };
      },
    );

    // Calculate final pagination with actual total
    const finalPagination = this.paginationService.calculatePagination(
      result.total,
      { page, limit },
    );

    // Get available filters (cached separately)
    const availableFilters = await this.getAvailableFiltersCached();

    // Parse technical_specs and optimize serialization
    const optimizedProducts =
      this.performanceService.optimizeResultSerialization(
        result.products.map((product) => ({
          ...product,
          technical_specs: this.parseJsonSafely(product.technical_specs),
        })),
      );

    const response: FilterResponse = {
      products: optimizedProducts,
      pagination: finalPagination,
      available_filters: availableFilters,
    };

    // Cache the result (5 minutes TTL)
    this.cacheService.set(cacheKey, response, { ttl: 300 });

    return response;
  }

  /**
   * Clear product-related caches
   */
  clearProductCaches(productId?: string): number {
    return this.cacheService.invalidateProductCache(productId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }

  private parseJsonSafely(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  }

  /**
   * Enhanced filtering with search integration
   */
  async filterProductsWithSearch(
    filters: CombinedFilters,
  ): Promise<FilterResponse> {
    const { search, ...otherFilters } = filters;

    // If search query is provided, use search service
    if (search && search.trim().length > 0) {
      const result = await this.searchService.searchWithFilters(
        search,
        otherFilters.inspiration,
        otherFilters.technical,
        {
          categories: otherFilters.categories,
          published: otherFilters.published,
        },
        {
          page: otherFilters.page || 1,
          limit: otherFilters.limit || 20,
        },
      );

      const availableFilters = await this.getAvailableFilters({});

      return {
        ...result,
        available_filters: availableFilters,
      };
    }

    // Otherwise, use regular filtering
    return this.filterProducts(filters);
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query: string, limit: number = 10) {
    return this.searchService.getSearchSuggestions(query, limit);
  }

  /**
   * Get popular search terms
   */
  async getPopularSearchTerms(limit: number = 10) {
    return this.searchService.getPopularSearchTerms(limit);
  }
  async getFilterStatistics() {
    const [totalProducts, publishedProducts, categoryCounts] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { is_published: true } }),
        this.prisma.category.findMany({
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        }),
      ]);

    return {
      total_products: totalProducts,
      published_products: publishedProducts,
      unpublished_products: totalProducts - publishedProducts,
      category_distribution: categoryCounts.map((cat) => ({
        category: cat.name,
        count: cat._count.products,
      })),
    };
  }
}
