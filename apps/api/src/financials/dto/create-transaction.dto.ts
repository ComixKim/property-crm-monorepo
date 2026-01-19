import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsUUID()
  property_id: string;

  @IsNotEmpty()
  @IsUUID()
  contract_id: string;

  @IsNotEmpty()
  @IsEnum([
    'rent_accrual',
    'rent_payment',
    'deposit',
    'expense',
    'maintenance_fee',
  ])
  type:
    | 'rent_accrual'
    | 'rent_payment'
    | 'deposit'
    | 'expense'
    | 'maintenance_fee';

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  due_date: string; // ISO Date string
}
