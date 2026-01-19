import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateInspectionDto {
  @IsNotEmpty()
  @IsUUID()
  property_id: string;

  @IsOptional()
  @IsUUID()
  agent_id?: string;

  @IsNotEmpty()
  @IsString()
  date: string; // ISO date string

  @IsOptional()
  @IsString()
  notes?: string;
}
