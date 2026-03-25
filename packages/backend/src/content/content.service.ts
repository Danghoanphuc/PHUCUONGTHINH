import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { UpdateContentItemDto } from './dto/update-content-item.dto';
import { ContentItem } from '@prisma/client';

const VALID_TYPES = ['design', 'project', 'construction'];

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: string): Promise<ContentItem[]> {
    return this.prisma.contentItem.findMany({
      where: type ? { type } : undefined,
      orderBy: { created_at: 'desc' },
    });
  }

  async create(dto: CreateContentItemDto): Promise<ContentItem> {
    if (!dto.title || dto.title.trim() === '') {
      throw new BadRequestException('title is required');
    }
    if (!dto.type || !VALID_TYPES.includes(dto.type)) {
      throw new BadRequestException(
        'type must be one of: design, project, construction',
      );
    }
    if (!dto.images || dto.images.length < 1) {
      throw new BadRequestException('images must have at least 1 element');
    }

    return this.prisma.contentItem.create({
      data: {
        title: dto.title,
        type: dto.type,
        description: dto.description,
        is_published: dto.is_published ?? false,
        images: JSON.stringify(dto.images),
      },
    });
  }

  async update(id: string, dto: UpdateContentItemDto): Promise<ContentItem> {
    const existing = await this.prisma.contentItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('ContentItem not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.is_published !== undefined) data.is_published = dto.is_published;
    if (dto.images !== undefined) data.images = JSON.stringify(dto.images);

    return this.prisma.contentItem.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.contentItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('ContentItem not found');
    }
    await this.prisma.contentItem.delete({ where: { id } });
  }
}
