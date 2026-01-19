import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('generate')
  @Roles('admin_uk', 'manager')
  generate() {
    return this.invoicesService.generateForCurrentMonth();
  }

  @Get()
  findAll(@Request() req: any) {
    return this.invoicesService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post(':id/pay')
  // Any authenticated user can pay technically, usually tenant.
  // Service should verify access or ownership via RLS/logic if explicit check needed.
  // For now, allow any auth user to try to pay (if they see it).
  pay(@Param('id') id: string, @Request() req: any) {
    return this.invoicesService.pay(id, req.user.sub);
  }
}
