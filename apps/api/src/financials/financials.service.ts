import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { format } from 'date-fns';

@Injectable()
export class FinancialsService {
  private readonly logger = new Logger(FinancialsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('financials')
      .insert({
        ...createTransactionDto,
        status:
          createTransactionDto.type === 'rent_accrual' ? 'pending' : 'paid', // Payments are paid immediately usually
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Transaction failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  // Generates rent accruals for all ACTIVE contracts for the current month
  async generateMonthlyAccruals() {
    const client = this.supabase.getClient();

    // 1. Get all active contracts
    const { data: contracts, error: fetchError } = await client
      .from('contracts')
      .select('*')
      .eq('status', 'active');

    if (fetchError) throw new InternalServerErrorException(fetchError.message);
    if (!contracts) return { message: 'No active contracts found', count: 0 };

    let count = 0;
    const errors = [];

    // 2. Loop and create accrual for each
    const today = new Date();
    const dueDate = format(today, 'yyyy-MM-dd'); // Due immediately for this simulation

    for (const contract of contracts) {
      // Check if already accrued for this month? (Skip for simple MVP simulation, we just allow manual run)

      const { error } = await client.from('financials').insert({
        property_id: contract.property_id,
        contract_id: contract.id,
        type: 'rent_accrual',
        amount: contract.monthly_rent,
        description: `Rent Accrual for ${format(today, 'MMMM yyyy')}`,
        due_date: dueDate,
        status: 'pending',
      });

      if (error) {
        errors.push({ contractId: contract.id, error: error.message });
      } else {
        count++;
      }
    }

    return { message: 'Accruals generated', successCount: count, errors };
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from('financials')
      .select('*, properties(title)')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findMyTransactions(userId: string) {
    // We need to find contracts for this user first, or join.
    // RLS usually handles this but since we are admin executing, let's filter manually or join.
    // Better: Filter by contracts where tenant_id = userId.

    // Let's use a join if possible, or 2 steps.
    // 1. Get Contract IDs for user.
    const { data: contracts } = await this.supabase
      .getClient()
      .from('contracts')
      .select('id')
      .eq('tenant_id', userId);

    if (!contracts || contracts.length === 0) return [];

    const contractIds = contracts.map((c) => c.id);

    // 2. Get financials
    const { data, error } = await this.supabase
      .getClient()
      .from('financials')
      .select('*, properties(title)')
      .in('contract_id', contractIds)
      .order('due_date', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // Aggregate revenue by month for the last 12 months for a specific owner
  async getMonthlyRevenue(ownerId: string) {
    // 1. Get properties owned by this owner
    const { data: properties } = await this.supabase
      .getClient()
      .from('properties')
      .select('id')
      .eq('owner_id', ownerId);

    if (!properties || properties.length === 0) return [];

    const propertyIds = properties.map((p) => p.id);

    // 2. Get all 'payment' (income) transactions for these properties
    // Note: In a real app, 'rent_accrual' might be income if accrual basis, or 'payment' if cash basis.
    // Let's assume 'payment' type is actual money coming in.
    const { data: transactions, error } = await this.supabase
      .getClient()
      .from('financials')
      .select('amount, created_at, type')
      .in('property_id', propertyIds)
      .eq('type', 'payment') // Assuming 'payment' type exists for income
      .gte(
        'created_at',
        format(
          new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
          'yyyy-MM-dd',
        ),
      ); // Last 12 months

    if (error) throw new InternalServerErrorException(error.message);

    // 3. Aggregate by month
    const monthlyRevenue: Record<string, number> = {};
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = format(d, 'MMM yyyy');
      months.push(key);
      monthlyRevenue[key] = 0;
    }

    transactions.forEach((t) => {
      const key = format(new Date(t.created_at), 'MMM yyyy');
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += t.amount;
      }
    });

    return months.map((month) => ({
      name: month,
      revenue: monthlyRevenue[month],
    }));
  }

  // Aggregate expenses by category for a specific owner
  async getExpensesBreakdown(ownerId: string) {
    // 1. Get properties
    const { data: properties } = await this.supabase
      .getClient()
      .from('properties')
      .select('id')
      .eq('owner_id', ownerId);

    if (!properties || properties.length === 0) return [];
    const propertyIds = properties.map((p) => p.id);

    // 2. Get 'expense' transactions
    const { data: transactions, error } = await this.supabase
      .getClient()
      .from('financials')
      .select('amount, description, type') // Description usually contains category or use type as category if detailed
      .in('property_id', propertyIds)
      .eq('type', 'expense');

    if (error) throw new InternalServerErrorException(error.message);

    // 3. Aggregate by category (using description or a simplified logic)
    // For MVP, let's assume 'expense' type covers all, and we group by description keywords or just show generic.
    // In a real app, 'category' column is better. Let's start with grouping by 'type' (which is just expense) -> boring.
    // Let's group by description logic or randomized for demo if no category field.
    // Actually, let's just group by 'type' if we had multiple expense types (maintenance, tax, etc).
    // Since we only have 'expense', let's mock categories based on description content or return single category.

    // Better: lets just return total expense vs income for now?
    // User asked for "Aggregate expenses by category".
    // Since we don't have a category column, let's rely on description text matching or return a single 'General' category.
    // OR create categories based on keywords.

    const categories: Record<string, number> = {};

    transactions.forEach((t) => {
      let cat = 'General';
      const desc = t.description.toLowerCase();
      if (desc.includes('maintenance') || desc.includes('repair'))
        cat = 'Maintenance';
      else if (desc.includes('tax')) cat = 'Tax';
      else if (desc.includes('insurance')) cat = 'Insurance';
      else if (
        desc.includes('utility') ||
        desc.includes('water') ||
        desc.includes('gas')
      )
        cat = 'Utilities';

      categories[cat] = (categories[cat] || 0) + t.amount;
    });

    return Object.keys(categories).map((name) => ({
      name,
      value: categories[name],
    }));
  }
}
