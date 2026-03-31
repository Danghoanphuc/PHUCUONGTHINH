import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStyleDto } from './dto/create-style.dto';
import { UpdateStyleDto } from './dto/update-style.dto';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class StylesService {
  constructor(private prisma: PrismaService) {}

  async create(createStyleDto: CreateStyleDto) {
    try {
      return await this.prisma.style.create({
        data: createStyleDto,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Style name must be unique');
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.style.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const style = await this.prisma.style.findUnique({
      where: { id },
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

    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    return style;
  }

  async update(id: string, updateStyleDto: UpdateStyleDto) {
    try {
      return await this.prisma.style.update({
        where: { id },
        data: updateStyleDto,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Style with ID ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Style name must be unique');
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.style.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Style with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async findByName(name: string) {
    return this.prisma.style.findUnique({
      where: { name },
    });
  }
}
