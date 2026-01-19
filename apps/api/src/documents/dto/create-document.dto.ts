import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export enum DocumentCategory {
  LEASE = 'lease',
  ID = 'id',
  PHOTO = 'photo',
  OTHER = 'other',
}

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  file_path: string;

  @IsEnum(DocumentCategory)
  @IsOptional()
  category?: DocumentCategory;

  @IsUUID()
  @IsOptional()
  property_id?: string;

  @IsUUID()
  @IsOptional()
  tenant_id?: string;

  @IsBoolean()
  @IsOptional()
  is_shared?: boolean;
}
