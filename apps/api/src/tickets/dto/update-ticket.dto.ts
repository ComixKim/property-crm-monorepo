import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'])
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';

  @IsOptional()
  @IsString()
  assignee_id?: string;
}
