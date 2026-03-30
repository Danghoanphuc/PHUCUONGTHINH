import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UploadMediaDto {
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
  @IsBoolean()
  is_cover?: boolean;
}

export class GetPresignedUrlDto {
  @IsString()
  filename: string;

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

  @IsString()
  content_type: string;
}
