import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryRecordDto } from './dto/create-inventory-record.dto';
import { StockQueryDto } from './dto/stock-query.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStock(query: StockQueryDto) {
    return this.prisma.stockLevel.findMany({
      where: {
        ...(query.warehouse_id && { warehouse_id: query.warehouse_id }),
      },
      include: {
        product_internal: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        warehouse: {
          select: { id: true, name: true, location: true },
        },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async createRecord(dto: CreateInventoryRecordDto, createdBy: string) {
    const { product_id, warehouse_id, type, quantity, note } = dto;

    // Get current stock level
    const currentStock = await this.prisma.stockLevel.findUnique({
      where: { product_id_warehouse_id: { product_id, warehouse_id } },
    });

    const currentQty = currentStock?.quantity ?? 0;

    // Validate "out" type doesn't exceed current stock
    if (type === 'out' && quantity > currentQty) {
      throw new BadRequestException('Số lượng xuất vượt quá tồn kho');
    }

    // Calculate new quantity
    let newQuantity: number;
    if (type === 'in') {
      newQuantity = currentQty + quantity;
    } else if (type === 'out') {
      newQuantity = currentQty - quantity;
    } else {
      // adjustment: set directly
      newQuantity = quantity;
    }

    // Create record and upsert stock level in a single transaction
    const [record] = await this.prisma.$transaction([
      this.prisma.inventoryRecord.create({
        data: {
          product_id,
          warehouse_id,
          type,
          quantity,
          note,
          created_by: createdBy,
        },
      }),
      this.prisma.stockLevel.upsert({
        where: { product_id_warehouse_id: { product_id, warehouse_id } },
        create: { product_id, warehouse_id, quantity: newQuantity },
        update: { quantity: newQuantity },
      }),
    ]);

    return record;
  }

  async getRecordsByProduct(productId: string) {
    return this.prisma.inventoryRecord.findMany({
      where: { product_id: productId },
      include: {
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getWarehouses() {
    return this.prisma.warehouse.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }
}
