import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
} from 'class-validator';

export class CreateMediaDto {
  @IsString()
  product_id: string;

  @IsString()
  file_url: string;

  @IsString()
  file_type: string;

  @IsString()
  @IsIn([
    'lifestyle',
    'cutout',
    'showcase',
    'video',
    '3d_file',
    'pdf',
    'social_link',
  ])
  media_type: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_cover?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  file_size?: number;

  @IsOptional()
  @IsString()
  alt_text?: string;
}
