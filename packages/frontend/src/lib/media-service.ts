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

export interface PresignedUrlResponse {
  upload_url: string;
  public_url: string;
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

const ALL_IMAGE_VIDEO_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "mp4", "mov"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const ALLOWED_SOCIAL_DOMAINS = [
  "pinterest.com",
  "instagram.com",
  "houzz.com",
  "facebook.com",
];

export function validateFile(
  file: File,
  mediaType: string,
): FileValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed =
    ALLOWED_EXTENSIONS[mediaType as MediaType] ?? ALL_IMAGE_VIDEO_EXTENSIONS;

  if (!allowed.includes(ext)) {
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

export async function getPresignedUrl(
  productId: string,
  filename: string,
  mediaType: MediaType,
  contentType: string,
): Promise<PresignedUrlResponse> {
  return apiClient.post<PresignedUrlResponse>(
    `/media/products/${productId}/presigned-url`,
    { filename, media_type: mediaType, content_type: contentType },
  );
}

export async function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (uploadUrl.includes("/api/v1/media/upload")) {
    const url = new URL(uploadUrl);
    const key = url.pathname.replace("/api/v1/media/upload/", "");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("key", decodeURIComponent(key));

    const baseUrl = uploadUrl.split("/api/v1/media/upload")[0];
    await axios.post(`${baseUrl}/api/v1/media/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
  } else {
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
  }
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

export const mediaService = {
  validateFile,
  validateSocialUrl,
  getPresignedUrl,
  uploadFileToS3,
  createMediaRecord,
  deleteMedia,
  updateSortOrder,
};
