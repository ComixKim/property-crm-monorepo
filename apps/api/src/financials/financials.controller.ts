import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('financials')
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Post()
  @Roles('admin_uk', 'manager', 'owner')
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.financialsService.create(createTransactionDto);
  }

  @Post('accruals/generate')
  @Roles('admin_uk', 'manager', 'owner')
  generateAccruals() {
    return this.financialsService.generateMonthlyAccruals();
  }

  @Get()
  @Roles('admin_uk', 'manager', 'owner')
  findAll() {
    return this.financialsService.findAll();
  }

  @Get('my')
  @Roles('tenant', 'admin') // Tenants see their own path
  findMyTransactions(@Request() req: any) {
    return this.financialsService.findMyTransactions(req.user.sub);
  }

  @Get('revenue-chart')
  @Roles('owner', 'manager', 'admin_uk')
  getMonthlyRevenue(@Request() req: any) {
    // Owners see their own data. Managers/Admins seeing "my" doesn't make sense unless they own properties or we pass an ID.
    // For now, assume this is for the logged-in user (Owner).
    return this.financialsService.getMonthlyRevenue(req.user.sub);
  }

  @Get('expenses-chart')
  @Roles('owner', 'manager', 'admin_uk')
  getExpensesBreakdown(@Request() req: any) {
    return this.financialsService.getExpensesBreakdown(req.user.sub);
  }
}
