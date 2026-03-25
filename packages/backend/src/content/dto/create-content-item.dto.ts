import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  IsIn,
} from 'class-validator';

const VALID_TYPES = ['design', 'project', 'construction'] as const;

export class CreateContentItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsIn(VALID_TYPES)
  type: 'design' | 'project' | 'construction';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  images: string[];
}
