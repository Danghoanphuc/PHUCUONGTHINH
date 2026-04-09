import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Sse,
  Header,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CombinedFilterService } from './services/combined-filter.service';
import { ProductsEventService } from './products-events.service';

function safeParseInt(value: any, fallback: number): number {
  const n = parseInt(value, 10);
  return isNaN(n) ? fallback : n;
}

function safeParseJson(value: any): any {
  if (!value) return undefined;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return undefined;
  }
}

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly combinedFilterService: CombinedFilterService,
    private readonly productsEventService: ProductsEventService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // SSE endpoint — frontend subscribes here for real-time product changes
  @Sse('events')
  events() {
    return this.productsEventService
      .getEvents()
      .pipe(map((event) => ({ data: JSON.stringify(event) })));
  }

  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findAll(@Query() filters: ProductFiltersDto) {
    return this.productsService.findAll(filters);
  }

  @Get('filters')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async findAllWithFilters(@Query() query: any) {
    const filters = {
      _t: query._t,
      categories: query.categories
        ? Array.isArray(query.categories)
          ? query.categories
          : [query.categories]
        : undefined,
      search: query.search || query.q || query.query,
      published: query.published || 'true',
      page: safeParseInt(query.page, 1),
      limit: safeParseInt(query.limit, 20),
      inspiration: {
        styles: query.styles
          ? Array.isArray(query.styles)
            ? query.styles
            : [query.styles]
          : undefined,
        spaces: query.spaces
          ? Array.isArray(query.spaces)
            ? query.spaces
            : [query.spaces]
          : undefined,
      },
      technical: safeParseJson(query.technical || query.technical_specs),
    };

    return this.combinedFilterService.filterProducts(filters);
  }

  @Get('search')
  async searchProducts(@Query() query: any) {
    const searchQuery = query.q || query.query || '';
    const limit = safeParseInt(query.limit, 10);
    return this.combinedFilterService.getSearchSuggestions(searchQuery, limit);
  }

  @Get('search/suggestions')
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = safeParseInt(limit, 10);
    return this.combinedFilterService.getSearchSuggestions(query, limitNum);
  }

  @Get('search/popular')
  getPopularSearchTerms(@Query('limit') limit?: string) {
    const limitNum = safeParseInt(limit, 10);
    return this.combinedFilterService.getPopularSearchTerms(limitNum);
  }

  @Get('cache/stats')
  @UseGuards(JwtAuthGuard)
  getCacheStats() {
    return this.combinedFilterService.getCacheStats();
  }

  @Delete('cache')
  @UseGuards(JwtAuthGuard)
  clearCache(@Query('productId') productId?: string) {
    const deletedCount =
      this.combinedFilterService.clearProductCaches(productId);
    return { message: `Cleared ${deletedCount} cache entries` };
  }

  @Get('filters/statistics')
  getFilterStatistics() {
    return this.combinedFilterService.getFilterStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/golden-record')
  async getGoldenRecord(@Param('id') id: string) {
    return this.productsService.getGoldenRecord(id);
  }

  @Get('sku/:sku')
  findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get('sku/:sku/golden-record')
  async getGoldenRecordBySku(@Param('sku') sku: string) {
    return this.productsService.getGoldenRecordBySku(sku);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updatePut(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  publish(@Param('id') id: string) {
    return this.productsService.publish(id);
  }

  @Patch(':id/unpublish')
  @UseGuards(JwtAuthGuard)
  unpublish(@Param('id') id: string) {
    return this.productsService.unpublish(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
