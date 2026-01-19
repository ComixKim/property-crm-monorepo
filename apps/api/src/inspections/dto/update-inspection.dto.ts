import { PartialType } from '@nestjs/mapped-types';
import { CreateInspectionDto } from './create-inspection.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {
  @IsOptional()
  @IsEnum(['scheduled', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
