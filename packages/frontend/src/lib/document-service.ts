import { adminApiClient } from "./admin-api-client";

export interface DocumentCategory {
  id: string;
  name: string;
  code: string;
}

export interface DocumentTag {
  id: string;
  document_id: string;
  entity_type: "ORDER" | "CUSTOMER" | "PRODUCT" | "LEAD";
  entity_id: string;
  created_at: string;
}

export interface Document {
  id: string;
  file_name: string;
  original_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  category_id: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  category: DocumentCategory;
  tags: DocumentTag[];
}

export const documentService = {
  /**
   * Upload a document with optional entity tags
   */
  async uploadDocument(
    file: File,
    categoryId: string,
    tags?: Array<{ entity_type: string; entity_id: string }>,
  ): Promise<Document> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category_id", categoryId);
    if (tags) {
      formData.append("tags", JSON.stringify(tags));
    }

    const response = await adminApiClient.post<Document>(
      "/documents/upload",
      formData,
      // Do NOT set Content-Type manually — let browser set it with boundary
    );
    return response;
  },

  /**
   * Add a tag to existing document
   */
  async addDocumentTag(
    documentId: string,
    entityType: string,
    entityId: string,
  ): Promise<DocumentTag> {
    const response = await adminApiClient.post<DocumentTag>(
      `/documents/${documentId}/tags`,
      {
        entity_type: entityType,
        entity_id: entityId,
      },
    );
    return response;
  },

  /**
   * Get all documents with filters
   */
  async getDocuments(filters?: {
    category_id?: string;
    entity_type?: string;
    entity_id?: string;
    search?: string;
  }): Promise<Document[]> {
    const response = await adminApiClient.get<Document[]>("/documents", {
      params: filters,
    });
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get documents by entity (for contextual view)
   */
  async getDocumentsByEntity(
    entityType: string,
    entityId: string,
  ): Promise<Document[]> {
    const response = await adminApiClient.get<Document[]>(
      `/documents/entity/${entityType}/${entityId}`,
    );
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<DocumentCategory[]> {
    const response = await adminApiClient.get<DocumentCategory[]>(
      "/documents/categories",
    );
    return Array.isArray(response) ? response : [];
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await adminApiClient.delete(`/documents/${documentId}`);
  },
};
