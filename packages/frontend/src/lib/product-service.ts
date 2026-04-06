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
  /**
   * Fetch products with caching and normalization
   */
  async getProducts(
    pageOrFilters: number | ProductFilters = 1,
    limit: number = 10,
    search?: string,
    bustCache: boolean = false,
  ): Promise<ProductFiltersResponse> {
    const isPublic = typeof pageOrFilters === "object";
    const params = new URLSearchParams();

    if (isPublic) {
      const f = pageOrFilters as ProductFilters;
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
        params.set("technical", JSON.stringify(f.technical_specs));
    } else {
      params.set("page", pageOrFilters.toString());
      params.set("limit", limit.toString());
      params.set("published", "all");
      if (search) params.set("search", search);
    }

    // Add cache buster to force fresh data from server (bypass browser/CDN cache)
    if (bustCache) {
      params.set("_t", Date.now().toString());
    }

    const cacheKey = `products:list:${params.toString()}`;
    if (!bustCache && !isPublic) {
      // Admin pages usually want fresh data but we can cache public ones
      const cached = clientCache.get<ProductFiltersResponse>(cacheKey);
      if (cached) return cached;
    }

    // Use /filters endpoint for everything as it's optimized
    const raw = await rawApiClient.getRaw<BackendProductsResponse>(
      `/products/filters?${params.toString()}`,
    );

    const result = {
      products: (raw.data ?? (raw as any).products ?? []).map(normalizeTags),
      pagination: raw.pagination,
      available_filters: (raw as any).available_filters,
    };

    if (isPublic) {
      clientCache.set(cacheKey, result, 300_000); // 5 minutes cache for public lists
    }

    return result;
  }

  async getProductById(id: string, bustCache = false): Promise<Product> {
    const cacheKey = `products:detail:${id}`;
    if (!bustCache) {
      const cached = clientCache.get<Product>(cacheKey);
      if (cached) return cached;
    }

    // Add cache buster to force fresh data from server
    const cacheBuster = bustCache ? `?_t=${Date.now()}` : "";
    const raw = await apiClient.get<any>(`/products/${id}${cacheBuster}`);
    const product = normalizeTags(raw);

    clientCache.set(cacheKey, product, 600_000); // 10 minutes cache for details
    return product;
  }

  async getProductBySku(
    sku: string,
    bustCache = false,
  ): Promise<Product | null> {
    const cacheKey = `products:sku:${sku}`;
    if (!bustCache) {
      const cached = clientCache.get<Product>(cacheKey);
      if (cached) return cached;
    }

    try {
      // Add cache buster to force fresh data from server
      const cacheBuster = bustCache ? `?_t=${Date.now()}` : "";
      const raw = await apiClient.get<any>(
        `/products/sku/${encodeURIComponent(sku)}${cacheBuster}`,
      );
      if (!raw || !raw.id) return null;
      const product = normalizeTags(raw);
      clientCache.set(cacheKey, product, 600_000);
      return product;
    } catch {
      return null;
    }
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
