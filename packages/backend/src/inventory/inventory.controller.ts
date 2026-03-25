import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryRecordDto } from './dto/create-inventory-record.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('inventory/stock')
  getStock(@Query() query: StockQueryDto) {
    return this.inventoryService.getStock(query);
  }

  @Post('inventory/records')
  createRecord(@Body() dto: CreateInventoryRecordDto, @Request() req: any) {
    return this.inventoryService.createRecord(dto, req.user?.id ?? 'unknown');
  }

  @Get('inventory/records/:productId')
  getRecordsByProduct(@Param('productId') productId: string) {
    return this.inventoryService.getRecordsByProduct(productId);
  }

  @Get('warehouses')
  getWarehouses() {
    return this.inventoryService.getWarehouses();
  }
}
