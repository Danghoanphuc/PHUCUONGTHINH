import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InternalProductsService } from './internal-products.service';
import { UpdateInternalProductDto } from './dto/update-internal-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class InternalProductsController {
  constructor(
    private readonly internalProductsService: InternalProductsService,
  ) {}

  @Get(':id/internal')
  findOne(@Param('id') id: string) {
    return this.internalProductsService.findByProductId(id);
  }

  @Patch(':id/internal')
  @HttpCode(HttpStatus.OK)
  upsert(@Param('id') id: string, @Body() dto: UpdateInternalProductDto) {
    return this.internalProductsService.upsert(id, dto);
  }
}
