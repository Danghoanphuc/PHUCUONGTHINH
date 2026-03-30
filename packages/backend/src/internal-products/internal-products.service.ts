import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInternalProductDto } from './dto/update-internal-product.dto';
import { InternalProductResponseDto } from './dto/internal-product-response.dto';

@Injectable()
export class InternalProductsService {
  constructor(private prisma: PrismaService) {}

  async findByProductId(
    productId: string,
  ): Promise<InternalProductResponseDto | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const internal = await this.prisma.productInternal.findUnique({
      where: { product_id: productId },
      include: {
        stock_levels: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (!internal) {
      return null;
    }

    return internal as InternalProductResponseDto;
  }

  async upsert(
    productId: string,
    dto: UpdateInternalProductDto,
  ): Promise<InternalProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const internal = await this.prisma.productInternal.upsert({
      where: { product_id: productId },
      create: {
        product_id: productId,
        cost_price: dto.cost_price,
        price_retail: dto.price_retail,
        price_wholesale: dto.price_wholesale,
        wholesale_discount_tiers: dto.wholesale_discount_tiers,
        price_dealer: dto.price_dealer,
        price_promo: dto.price_promo,
        promo_start_date: dto.promo_start_date,
        promo_end_date: dto.promo_end_date,
        promo_note: dto.promo_note,
        warehouse_location: dto.warehouse_location,
        stock_status: dto.stock_status,
        stock_quantity: dto.stock_quantity,
        supplier_name: dto.supplier_name,
        supplier_phone: dto.supplier_phone,
        internal_notes: dto.internal_notes,
      },
      update: {
        ...(dto.cost_price !== undefined && { cost_price: dto.cost_price }),
        ...(dto.price_retail !== undefined && {
          price_retail: dto.price_retail,
        }),
        ...(dto.price_wholesale !== undefined && {
          price_wholesale: dto.price_wholesale,
        }),
        ...(dto.wholesale_discount_tiers !== undefined && {
          wholesale_discount_tiers: dto.wholesale_discount_tiers,
        }),
        ...(dto.price_dealer !== undefined && {
          price_dealer: dto.price_dealer,
        }),
        ...(dto.price_promo !== undefined && { price_promo: dto.price_promo }),
        ...(dto.promo_start_date !== undefined && {
          promo_start_date: dto.promo_start_date,
        }),
        ...(dto.promo_end_date !== undefined && {
          promo_end_date: dto.promo_end_date,
        }),
        ...(dto.promo_note !== undefined && { promo_note: dto.promo_note }),
        ...(dto.warehouse_location !== undefined && {
          warehouse_location: dto.warehouse_location,
        }),
        ...(dto.stock_status !== undefined && {
          stock_status: dto.stock_status,
        }),
        ...(dto.stock_quantity !== undefined && {
          stock_quantity: dto.stock_quantity,
        }),
        ...(dto.supplier_name !== undefined && {
          supplier_name: dto.supplier_name,
        }),
        ...(dto.supplier_phone !== undefined && {
          supplier_phone: dto.supplier_phone,
        }),
        ...(dto.internal_notes !== undefined && {
          internal_notes: dto.internal_notes,
        }),
      },
      include: {
        stock_levels: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    return internal as InternalProductResponseDto;
  }
}
