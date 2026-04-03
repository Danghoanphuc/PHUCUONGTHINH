import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  tags?: Array<{
    entity_type: 'ORDER' | 'CUSTOMER' | 'PRODUCT' | 'LEAD';
    entity_id: string;
  }>;
}

export class AddDocumentTagDto {
  @IsString()
  @IsNotEmpty()
  entity_type: 'ORDER' | 'CUSTOMER' | 'PRODUCT' | 'LEAD';

  @IsString()
  @IsNotEmpty()
  entity_id: string;
}
