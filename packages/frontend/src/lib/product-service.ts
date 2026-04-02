import { apiClient, rawApiClient } from "./admin-api-client";
import { cleanPayload } from "./constants";
import { clientCache } from "./cache-utils";

export interface ProductTag {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category_id: string;
  technical_specs: Record<string, any>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  style_tags?: ProductTag[];
  space_tags?: ProductTag[];
  media?: any[];
}

/** Normalize nested style_tags/space_tags từ backend về dạng flat { id, name } */
function normalizeTags(product: any): any {
  return {
    ...product,
    style_tags: (product.style_tags ?? []).map((t: any) =>
      t.style ? { id: t.style.id, name: t.style.name } : t,
    ),
    space_tags: (product.space_tags ?? []).map((t: any) =>
      t.space ? { id: t.space.id, name: t.space.name } : t,
    ),
  };
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  description?: string;
  category_id: string;
  technical_specs: Record<string, any>;
  style_ids?: string[];
  space_ids?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  description?: string;
  category_id?: string;
  technical_specs?: Record<string, any>;
  is_published?: boolean;
  style_ids?: string[];
  space_ids?: string[];
}

export interface ProductFiltersResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  available_filters?: {
    inspiration?: {
      styles?: Style[];
      spaces?: Space[];
    };
  };
}

export interface Style {
  id: string;
  name: string;
}
export interface Space {
  id: string;
  name: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  styles?: string[];
  spaces?: string[];
  published?: boolean | "all";
  technical_specs?: Record<string, any>;
}

interface BackendProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

class ProductService {
  async getProducts(
    pageOrFilters: number | ProductFilters = 1,
    limit: number = 10,
    search?: string,
    bustCache: boolean = false,
  ): Promise<ProductFiltersResponse> {
    let params: URLSearchParams;

    if (typeof pageOrFilters === "object") {
      // Called with filters object (public pages)
      const f = pageOrFilters;
      params = new URLSearchParams();
      if (f.page) params.set("page", f.page.toString());
      if (f.limit) params.set("limit", f.limit.toString());
      if (f.search) params.set("search", f.search);
      if (f.category) params.set("category", f.category);
      if (f.published !== undefined)
        params.set(
          "published",
          f.published === "all" ? "all" : f.published ? "true" : "false",
        );
      if (f.styles?.length) f.styles.forEach((s) => params.append("styles", s));
      if (f.spaces?.length) f.spaces.forEach((s) => params.append("spaces", s));
      if (f.technical_specs)
        params.set("technical_specs", JSON.stringify(f.technical_specs));
    } else {
      // Called with (page, limit, search) — admin pages
      params = new URLSearchParams({
        page: pageOrFilters.toString(),
        limit: limit.toString(),
        published: "all",
      });
      if (search) params.append("search", search);

      // Admin pages always bust cache - add timestamp to bypass backend cache
      params.set("_t", Date.now().toString());
    }

    const raw = await rawApiClient.getRaw<BackendProductsResponse>(
      `/products?${params.toString()}`,
    );

    return {
      products: (raw.data ?? []).map(normalizeTags),
      pagination: raw.pagination,
      available_filters: (raw as any).available_filters,
    };
  }

  async getProductById(id: string, bustCache = false): Promise<Product> {
    // Add cache buster to URL if requested
    const url = bustCache 
      ? `/products/${id}?_t=${Date.now()}` 
      : `/products/${id}`;
    const raw = await apiClient.get<any>(url);
    const product = normalizeTags(raw);
    return product;
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>("/products", cleanPayload(data));
  }

  async updateProduct(
    id: string,
    data: UpdateProductRequest,
  ): Promise<Product> {
    const result = await apiClient.put<Product>(
      `/products/${id}`,
      cleanPayload(data),
    );

    // Invalidate cache for this product
    clientCache.invalidateProduct(id);

    return result;
  }

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);

    // Invalidate cache
    clientCache.invalidateProduct(id);
  }

  async publishProduct(id: string): Promise<Product> {
    const result = await apiClient.patch<Product>(`/products/${id}/publish`);
    // Invalidate cache
    clientCache.invalidateProduct(id);
    return result;
  }

  async unpublishProduct(id: string): Promise<Product> {
    const result = await apiClient.patch<Product>(`/products/${id}/unpublish`);
    // Invalidate cache
    clientCache.invalidateProduct(id);
    return result;
  }

  async cloneProduct(id: string): Promise<Product> {
    const source = await this.getProductById(id);
    const cloned = await this.createProduct({
      name: `${source.name} (Bản sao)`,
      sku: `${source.sku}-COPY-${Date.now().toString(36).toUpperCase()}`,
      description: source.description,
      category_id: source.category_id,
      technical_specs: source.technical_specs,
    });
    return cloned;
  }
}

export const productService = new ProductService();
