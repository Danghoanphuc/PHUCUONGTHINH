import axios from "axios";
import { apiClient } from "./admin-api-client";

export type MediaType =
  | "lifestyle"
  | "cutout"
  | "video"
  | "showcase"
  | "3d_file"
  | "pdf"
  | "social_link";

export interface CreateMediaDto {
  product_id: string;
  file_url: string;
  file_type: string;
  media_type: MediaType;
  is_cover?: boolean;
  sort_order?: number;
  alt_text?: string;
}

export interface MediaRecord {
  id: string;
  product_id: string;
  file_url: string;
  media_type: MediaType;
  is_cover: boolean;
  sort_order: number;
  alt_text?: string;
  created_at: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  lifestyle: ["jpg", "jpeg", "png", "webp"],
  cutout: ["jpg", "jpeg", "png", "webp"],
  showcase: ["jpg", "jpeg", "png", "webp"],
  video: ["mp4", "mov", "webm"],
  "3d_file": ["obj", "fbx", "glb", "gltf", "skp"],
  pdf: ["pdf"],
  social_link: [],
};

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const ALLOWED_SOCIAL_DOMAINS = [
  "pinterest.com",
  "instagram.com",
  "houzz.com",
  "facebook.com",
];

export function validateSocialUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_SOCIAL_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

export function validateFile(
  file: File,
  mediaType: string,
): FileValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed = ALLOWED_EXTENSIONS[mediaType as MediaType] ?? [
    "jpg",
    "jpeg",
    "png",
    "webp",
  ];

  if (allowed.length > 0 && !allowed.includes(ext)) {
    return {
      valid: false,
      error: `Định dạng không hợp lệ. Chấp nhận: ${allowed.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File vượt quá 50MB" };
  }

  return { valid: true };
}

/**
 * Upload file to Cloudinary via backend endpoint.
 * Returns the real Cloudinary URL.
 */
export async function uploadMedia(
  productId: string,
  file: File,
  mediaType: MediaType = "lifestyle",
  onProgress?: (percent: number) => void,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("media_type", mediaType);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const response = await axios.post(
    `${baseUrl}/api/v1/media/products/${productId}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    },
  );

  const url = response.data?.data?.url || response.data?.url;
  if (!url) throw new Error("Upload thất bại: không nhận được URL từ server");
  return url;
}

export async function createMediaRecord(
  data: CreateMediaDto,
): Promise<MediaRecord> {
  return apiClient.post<MediaRecord>("/media", data);
}

export async function deleteMedia(id: string): Promise<void> {
  await apiClient.delete(`/media/${id}`);
}

export async function updateSortOrder(
  productId: string,
  orders: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  await apiClient.patch(`/media/products/${productId}/sort-order`, orders);
}
