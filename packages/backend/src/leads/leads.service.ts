import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadFiltersDto } from './dto/lead-filters.dto';
import type { Lead } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const { product_ids, preferred_date, ...leadData } = createLeadDto;

    // Validate that at least one contact method is provided
    if (!leadData.email && !leadData.phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    // Validate products exist if provided
    if (product_ids && product_ids.length > 0) {
      const existingProducts = await this.prisma.product.findMany({
        where: { id: { in: product_ids } },
        select: { id: true },
      });

      if (existingProducts.length !== product_ids.length) {
        throw new BadRequestException('One or more product IDs are invalid');
      }
    }

    // Create lead with default status "new"
    const lead = await this.prisma.lead.create({
      data: {
        ...leadData,
        preferred_date: preferred_date ? new Date(preferred_date) : null,
        status: 'new', // Default status as per requirements
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    // Associate products if provided
    if (product_ids && product_ids.length > 0) {
      await this.prisma.leadProduct.createMany({
        data: product_ids.map((product_id) => ({
          lead_id: lead.id,
          product_id,
        })),
      });

      // Fetch the lead again with products
      const finalLead = await this.findOne(lead.id);
      // Fire-and-forget notification
      void this.notificationService.sendLeadNotification(finalLead);
      return finalLead;
    }

    // Fire-and-forget notification
    void this.notificationService.sendLeadNotification(lead);
    return lead;
  }

  async findAll(filters: LeadFiltersDto = {}) {
    const { status, page = '1', limit = '10' } = filters;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      ...(status && { status }),
    };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limitNum,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const existingLead = await this.findOne(id);
    const { product_ids, preferred_date, ...updateData } = updateLeadDto;

    // Validate contact information if being updated
    const newEmail =
      updateData.email !== undefined ? updateData.email : existingLead.email;
    const newPhone =
      updateData.phone !== undefined ? updateData.phone : existingLead.phone;

    if (!newEmail && !newPhone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    // Validate products exist if provided
    if (product_ids && product_ids.length > 0) {
      const existingProducts = await this.prisma.product.findMany({
        where: { id: { in: product_ids } },
        select: { id: true },
      });

      if (existingProducts.length !== product_ids.length) {
        throw new BadRequestException('One or more product IDs are invalid');
      }
    }

    // Update lead
    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...updateData,
        preferred_date: preferred_date ? new Date(preferred_date) : undefined,
        updated_at: new Date(), // Track status change timestamp
      },
    });

    // Update product associations if provided
    if (product_ids !== undefined) {
      // Remove existing associations
      await this.prisma.leadProduct.deleteMany({
        where: { lead_id: id },
      });

      // Add new associations
      if (product_ids.length > 0) {
        await this.prisma.leadProduct.createMany({
          data: product_ids.map((product_id) => ({
            lead_id: id,
            product_id,
          })),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const lead = await this.findOne(id);

    await this.prisma.lead.delete({
      where: { id },
    });
  }

  /**
   * Get leads filtered by status for CMS
   */
  async findByStatus(status: string) {
    return this.prisma.lead.findMany({
      where: { status },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Update lead status with timestamp tracking
   */
  async updateStatus(id: string, status: string): Promise<Lead> {
    const validStatuses = ['new', 'contacted', 'converted'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const existingLead = await this.findOne(id);

    return this.prisma.lead.update({
      where: { id },
      data: {
        status,
        updated_at: new Date(), // Track status change timestamp
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });
  }
}
