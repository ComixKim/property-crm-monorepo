import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { SupabaseService } from '../supabase.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, SupabaseService],
})
export class InvoicesModule {}
