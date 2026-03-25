import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { UpdateContentItemDto } from './dto/update-content-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  findAll(@Query('type') type?: string) {
    return this.contentService.findAll(type);
  }

  @Post()
  create(@Body() createContentItemDto: CreateContentItemDto) {
    return this.contentService.create(createContentItemDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContentItemDto: UpdateContentItemDto,
  ) {
    return this.contentService.update(id, updateContentItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
