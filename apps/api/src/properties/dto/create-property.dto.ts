import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsUUID,
} from 'class-validator';

export class CreatePropertyDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsUUID()
  owner_id?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'on_hold', 'archived'])
  status?: 'draft' | 'active' | 'on_hold' | 'archived';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
