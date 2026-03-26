import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('debug')
export class PerformanceTestController {
  constructor(private prisma: PrismaService) {}

  @Get('performance')
  async testPerformance() {
    const results: any = {};

    // Test 1: Simple query
    const start1 = Date.now();
    await this.prisma.product.count();
    results.simpleQuery = `${Date.now() - start1}ms`;

    // Test 2: Complex query with relations
    const start2 = Date.now();
    await this.prisma.product.findMany({
      take: 10,
      include: {
        category: true,
        style_tags: true,
        space_tags: true,
        media: true,
      },
    });
    results.complexQuery = `${Date.now() - start2}ms`;

    // Test 3: Database connection
    const start3 = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    results.dbPing = `${Date.now() - start3}ms`;

    // Test 4: Count all tables
    const start4 = Date.now();
    const [products, categories, media, styles, spaces] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.category.count(),
      this.prisma.media.count(),
      this.prisma.style.count(),
      this.prisma.space.count(),
    ]);
    results.parallelQueries = `${Date.now() - start4}ms`;
    results.counts = { products, categories, media, styles, spaces };

    return {
      message: 'Performance test results',
      timestamp: new Date().toISOString(),
      results,
      recommendations: this.getRecommendations(results),
    };
  }

  private getRecommendations(results: any): string[] {
    const recommendations: string[] = [];

    const simpleMs = parseInt(results.simpleQuery);
    const complexMs = parseInt(results.complexQuery);
    const pingMs = parseInt(results.dbPing);

    if (pingMs > 50) {
      recommendations.push(
        `⚠️  Database ping is slow (${pingMs}ms). Consider moving database closer to backend.`,
      );
    }

    if (simpleMs > 100) {
      recommendations.push(
        `⚠️  Simple queries are slow (${simpleMs}ms). Database might be overloaded or needs indexes.`,
      );
    }

    if (complexMs > 500) {
      recommendations.push(
        `⚠️  Complex queries are very slow (${complexMs}ms). Add indexes on foreign keys and frequently queried fields.`,
      );
    }

    if (complexMs / simpleMs > 10) {
      recommendations.push(
        `⚠️  Complex queries are ${Math.round(complexMs / simpleMs)}x slower than simple ones. Consider denormalizing data or using materialized views.`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Database performance looks good!');
    }

    return recommendations;
  }
}
