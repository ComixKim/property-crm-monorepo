import { IsOptional, IsString } from 'class-validator';

export class PayInvoiceDto {
  @IsOptional()
  @IsString()
  payment_method?: string; // e.g., 'card', 'bank_transfer'
}
