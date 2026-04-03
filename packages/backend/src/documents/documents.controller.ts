import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Request,
  Response,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import {
  UploadDocumentDto,
  AddDocumentTagDto,
} from './dto/upload-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * POST /documents/upload
   * Upload a document with metadata and optional tags
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('category_id') categoryId: string,
    @Body('tags') tagsRaw: string,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!categoryId) {
      throw new BadRequestException('Category ID is required');
    }

    let tags: Array<{ entity_type: string; entity_id: string }> | undefined;
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw);
      } catch {
        tags = undefined;
      }
    }
    return this.documentsService.uploadDocument(
      file,
      categoryId,
      req.user.id,
      tags,
    );
  }

  /**
   * POST /documents/:id/tags
   * Attach a document to an entity (Order, Customer, Product, Lead)
   */
  @Post(':id/tags')
  async addDocumentTag(
    @Param('id') documentId: string,
    @Body() dto: AddDocumentTagDto,
  ) {
    return this.documentsService.addDocumentTag(
      documentId,
      dto.entity_type,
      dto.entity_id,
    );
  }

  /**
   * GET /documents
   * Get all documents with optional filters
   * Query params: category_id, entity_type, entity_id, search
   */
  @Get()
  async getDocuments(
    @Query('category_id') categoryId?: string,
    @Query('entity_type') entityType?: string,
    @Query('entity_id') entityId?: string,
    @Query('search') search?: string,
  ) {
    return this.documentsService.getDocuments({
      category_id: categoryId,
      entity_type: entityType,
      entity_id: entityId,
      search,
    });
  }

  /**
   * GET /documents/categories
   * Get all document categories (public - no auth required)
   */
  @Get('categories')
  async getCategories() {
    return this.documentsService.getCategories();
  }

  /**
   * GET /documents/entity/:type/:id
   * Get documents related to a specific entity (for contextual view)
   */
  @Get('entity/:type/:id')
  async getDocumentsByEntity(
    @Param('type') entityType: string,
    @Param('id') entityId: string,
  ) {
    return this.documentsService.getDocumentsByEntity(entityType, entityId);
  }

  /**
   * GET /documents/:id/preview
   * Preview document file inline
   */
  @Get(':id/preview')
  async previewDocument(@Param('id') documentId: string, @Response() res) {
    return this.documentsService.previewDocument(documentId, res);
  }

  /**
   * GET /documents/:id/download
   * Download document file
   */
  @Get(':id/download')
  async downloadDocument(@Param('id') documentId: string, @Response() res) {
    return this.documentsService.downloadDocument(documentId, res);
  }

  /**
   * GET /documents/:id
   * Get document details
   */
  @Get(':id')
  async getDocument(@Param('id') documentId: string) {
    return this.documentsService.getDocument(documentId);
  }

  /**
   * DELETE /documents/:id
   * Delete a document
   */
  @Delete(':id')
  async deleteDocument(@Param('id') documentId: string) {
    return this.documentsService.deleteDocument(documentId);
  }
}
