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
  media?: Media[];
  style_tags?: { id: string; name: string }[];
  space_tags?: { id: string; name: string }[];
}

export interface Media {
  id: string;
  product_id: string;
  file_url: string;
  file_type: string;
  media_type:
    | "lifestyle"
    | "cutout"
    | "showcase"
    | "video"
    | "3d_file"
    | "pdf"
    | "social_link";
  sort_order: number;
  is_cover: boolean;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Style {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  inquiry_type: "appointment" | "quote";
  project_details?: string;
  status: "new" | "contacted" | "converted";
  preferred_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFiltersResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  available_filters: {
    inspiration: {
      styles: Style[];
      spaces: Space[];
    };
    technical: Record<string, any[]>;
    categories: Category[];
  };
}

export interface FilterState {
  categories?: string[];
  styles?: string[];
  spaces?: string[];
  technical_specs?: Record<string, any>;
  search?: string;
  page?: number;
  limit?: number;
}
