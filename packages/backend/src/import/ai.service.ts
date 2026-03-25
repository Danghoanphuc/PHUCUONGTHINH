import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ExtractedProduct {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  specs: Record<string, any>;
  price_retail?: number;
  price_dealer?: number;
  unit?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI | null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY not configured. AI extraction will not work.',
      );
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Call a function with retry logic and exponential backoff
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === this.MAX_RETRIES - 1;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || isLastAttempt) {
          this.logger.error(
            `${context} failed after ${attempt + 1} attempts: ${error.message}`,
          );
          throw error;
        }

        const delay = this.RETRY_DELAYS[attempt];
        this.logger.warn(
          `${context} failed (attempt ${attempt + 1}/${this.MAX_RETRIES}), retrying in ${delay}ms...`,
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Check if error is retryable (timeout, rate limit, network error)
   */
  private isRetryableError(error: any): boolean {
    // OpenAI rate limit error
    if (error.status === 429) return true;

    // Timeout or network errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') return true;

    // OpenAI server errors (5xx)
    if (error.status >= 500 && error.status < 600) return true;

    return false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract products from a PDF page image using GPT-4 Vision
   * @param imageBuffer PNG image buffer of PDF page
   * @param pageNumber Page number for logging
   * @returns Array of extracted products
   */
  async extractProducts(
    imageBuffer: Buffer,
    pageNumber: number,
  ): Promise<ExtractedProduct[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    this.logger.log(`Extracting products from page ${pageNumber}`);

    return this.callWithRetry(async () => {
      const base64Image = imageBuffer.toString('base64');

      const prompt = `
Bạn là chuyên gia phân tích catalogue sản phẩm vật liệu xây dựng (gạch, thiết bị vệ sinh, vật liệu phụ trợ).

Hãy trích xuất TOÀN BỘ sản phẩm từ trang catalogue này. Với mỗi sản phẩm, trích xuất:

- **name**: Tên sản phẩm đầy đủ (tiếng Việt)
- **sku**: Mã sản phẩm/Model (nếu có)
- **description**: Mô tả ngắn gọn về sản phẩm
- **category**: Phân loại sản phẩm (gạch/thiết bị vệ sinh/vật liệu phụ trợ/khác)
- **specs**: Object chứa thông số kỹ thuật:
  - kich_thuoc: Kích thước (VD: "600x1200mm", "800x800mm")
  - do_day: Độ dày (VD: "10mm")
  - chat_lieu: Chất liệu (VD: "Sứ cao cấp", "Porcelain")
  - mau_sac: Màu sắc
  - xuat_xu: Xuất xứ/Thương hiệu
  - [các thông số khác tùy loại sản phẩm]
- **price_retail**: Giá bán lẻ (số, đơn vị VNĐ, không có dấu phân cách)
- **price_dealer**: Giá đại lý (nếu có)
- **unit**: Đơn vị tính ("M2", "VIEN", "BO", "CAI", "SET")

LƯU Ý QUAN TRỌNG:
- Trích xuất TẤT CẢ sản phẩm trên trang, không bỏ sót
- Nếu không tìm thấy thông tin nào, để trống (null)
- Giá phải là số nguyên, không có dấu chấm phân cách
- Đơn vị tính phải là một trong: M2, VIEN, BO, CAI, SET

Trả về JSON theo format:
{
  "products": [
    {
      "name": "Gạch Ốp Lát Porcelain 600x1200",
      "sku": "GCH-600-1200-001",
      "description": "Gạch porcelain cao cấp, bề mặt bóng",
      "category": "gạch",
      "specs": {
        "kich_thuoc": "600x1200mm",
        "do_day": "10mm",
        "chat_lieu": "Porcelain",
        "xuat_xu": "Tây Ban Nha"
      },
      "price_retail": 1500000,
      "price_dealer": 1200000,
      "unit": "M2"
    }
  ]
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Updated to latest model with vision support
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                  detail: 'high', // Use high detail for better extraction
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4096,
        temperature: 0.1, // Low temperature for more consistent results
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const result = JSON.parse(content);

      if (!result.products || !Array.isArray(result.products)) {
        this.logger.warn(
          `Invalid response format from OpenAI for page ${pageNumber}`,
        );
        return [];
      }

      this.logger.log(
        `Extracted ${result.products.length} products from page ${pageNumber}`,
      );

      return result.products;
    }, `Extract products from page ${pageNumber}`);
  }

  /**
   * Check if OpenAI API is configured and working
   */
  async healthCheck(): Promise<boolean> {
    if (!this.openai) {
      return false;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      return !!response.choices[0];
    } catch (error) {
      this.logger.error(`OpenAI health check failed: ${error.message}`);
      return false;
    }
  }
}
