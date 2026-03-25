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
    // Verify product exists
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
    // Verify product exists
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
        supplier_name: dto.supplier_name,
        supplier_contact: dto.supplier_contact,
        internal_notes: dto.internal_notes,
      },
      update: {
        ...(dto.cost_price !== undefined && { cost_price: dto.cost_price }),
        ...(dto.supplier_name !== undefined && {
          supplier_name: dto.supplier_name,
        }),
        ...(dto.supplier_contact !== undefined && {
          supplier_contact: dto.supplier_contact,
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
