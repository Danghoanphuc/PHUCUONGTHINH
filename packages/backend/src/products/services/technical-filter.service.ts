import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from './cache.service';

export interface TechnicalFilters {
  size?: string[];
  material?: string[];
  surface_finish?: string[];
  slip_resistance?: string[];
  origin?: string[];
  thickness_mm?: { min?: number; max?: number };
  [key: string]: any;
}

@Injectable()
export class TechnicalFilterService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Build where clause for technical specification filtering
   * Uses JSON queries for SQLite technical_specs field
   */
  buildTechnicalWhere(filters: TechnicalFilters): any {
    const conditions: any[] = [];

    // Handle each technical specification filter
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value) && value.length > 0) {
        // Array filters - match any of the values
        // Use two variants to handle JSON with/without spaces after colon
        const orConditions = value.flatMap((val) => [
          { technical_specs: { contains: `"${key}":"${val}"` } },
          { technical_specs: { contains: `"${key}": "${val}"` } },
        ]);
        conditions.push({ OR: orConditions });
      } else if (
        typeof value === 'object' &&
        value !== null &&
        (value.min !== undefined || value.max !== undefined)
      ) {
        conditions.push({
          technical_specs: { contains: `"${key}":` },
        });
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        // Exact match - handle both compact and spaced JSON
        conditions.push({
          OR: [
            { technical_specs: { contains: `"${key}":"${value}"` } },
            { technical_specs: { contains: `"${key}": "${value}"` } },
          ],
        });
      }
    });

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  /**
   * Extract available technical specification options from existing products
   * Optimized with caching to avoid full table scans on every request
   */
  async getAvailableTechnicalFilters(baseWhere: any = {}) {
    const cacheKey = `available_technical_filters:${JSON.stringify(baseWhere)}`;

    return this.cacheService.cached(
      cacheKey,
      async () => {
        // Get all products to analyze their technical specs
        // Only fetch technical_specs to minimize I/O
        const products = await this.prisma.product.findMany({
          where: baseWhere,
          select: {
            technical_specs: true,
          },
        });

        const technicalOptions: Record<string, Set<any>> = {};

        // Parse and aggregate technical specifications
        products.forEach((product) => {
          try {
            if (!product.technical_specs) return;
            const specs = JSON.parse(product.technical_specs);
            Object.entries(specs).forEach(([key, value]) => {
              // Skip internal/system keys
              if (
                [
                  'slug',
                  'meta_title',
                  'meta_description',
                  'product_type',
                  'badges',
                ].includes(key)
              )
                return;

              if (!technicalOptions[key]) {
                technicalOptions[key] = new Set();
              }

              if (Array.isArray(value)) {
                value.forEach((v) => {
                  if (v !== null && v !== undefined)
                    technicalOptions[key].add(v);
                });
              } else if (value !== null && value !== undefined) {
                technicalOptions[key].add(value);
              }
            });
          } catch (error) {
            // Skip invalid JSON
          }
        });

        // Convert sets to arrays and sort
        const result: Record<string, any[]> = {};
        Object.entries(technicalOptions).forEach(([key, valueSet]) => {
          result[key] = Array.from(valueSet).sort((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') return a - b;
            return String(a).localeCompare(String(b));
          });
        });

        return result;
      },
      { ttl: 600 }, // 10 minutes cache
    );
  }

  /**
   * Get common technical specification fields for the UI
   */
  getCommonTechnicalFields() {
    return {
      material: [
        'Porcelain',
        'Đá đồng chất',
        'Ceramic',
        'Granite',
        'Nano',
        'Full Body Porcelain',
      ],
      surface_finish: [
        'Bóng',
        'Bóng vittinh',
        'Mờ',
        'Giả đá tự nhiên',
        'Giả gỗ',
        'Glossy',
      ],
      slip_resistance: ['R9', 'R10', 'R11', 'R12'],
      origin: [
        'Việt Nam',
        'Ý',
        'Tây Ban Nha',
        'Trung Quốc',
        'Ấn Độ',
        'Malaysia',
        'Indonesia',
        'Thái Lan',
      ],
    };
  }

  /**
   * Validate technical specification filters
   */
  validateTechnicalFilters(filters: TechnicalFilters): boolean {
    // Basic validation - ensure no malicious JSON injection
    try {
      Object.entries(filters).forEach(([key, value]) => {
        if (
          typeof key !== 'string' ||
          key.includes('"') ||
          key.includes('\\')
        ) {
          throw new Error('Invalid filter key');
        }

        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (
              typeof v === 'string' &&
              (v.includes('"') || v.includes('\\'))
            ) {
              throw new Error('Invalid filter value');
            }
          });
        }
      });
      return true;
    } catch {
      return false;
    }
  }
}
