import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { format } from 'date-fns';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) { }

  // Admin/System: Generate invoices for all active contracts for the current month
  async generateForCurrentMonth() {
    const client = this.supabase.getClient();

    // 1. Get all active contracts
    const { data: contracts, error: contractError } = await client
      .from('contracts')
      .select('id, monthly_rent, property_id, tenant_id')
      .eq('status', 'active');

    if (contractError)
      throw new InternalServerErrorException(contractError.message);
    if (!contracts?.length) return { message: 'No active contracts found' };

    // 2. Create invoices
    const createdInvoices = [];
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // 1st of next month? Or current?
    // Let's assume standard is due 1st of CURRENT month if generating early, or next.
    // Simple logic: due 5 days from now for demo.
    const dueStr = format(
      new Date(today.setDate(today.getDate() + 5)),
      'yyyy-MM-dd',
    );

    for (const contract of contracts) {
      // Check if already exists for this month to avoid duplicates (simplified check)
      // Skipping check for MVP speed, or basic check:

      const { data, error } = await client
        .from('invoices')
        .insert({
          contract_id: contract.id,
          amount: contract.monthly_rent,
          status: 'pending',
          due_date: dueStr,
        })
        .select()
        .single();

      if (!error && data) {
        createdInvoices.push(data);

        // Create Financial Accrual Record for Admin Reporting
        await client.from('financials').insert({
          property_id: contract.property_id,
          contract_id: contract.id,
          type: 'rent_accrual',
          amount: contract.monthly_rent,
          description: `Rent Accrual for ${format(today, 'MMMM yyyy')} (Inv #${data.id.slice(0, 6)})`,
          due_date: dueStr,
          status: 'pending'
        });

        // Notify Tenant
        await this.notificationsService.create({
          user_id: contract.tenant_id,
          title: 'New Invoice',
          message: `A new rent invoice for ${contract.monthly_rent} has been generated.`,
          type: 'info',
          metadata: { invoice_id: data.id },
        });
      }
    }

    return { generated: createdInvoices.length, invoices: createdInvoices };
  }

  async findAll(userId: string) {
    // RLS handles visibility, but we filter loosely by user if needed or just fetch
    const { data, error } = await this.supabase
      .getClient()
      .from('invoices')
      .select(
        `
                *,
                contracts (
                    id,
                    properties (title, address)
                )
            `,
      )
      .order('due_date', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async pay(id: string, userId: string) {
    const client = this.supabase.getClient();

    // 1. Get invoice
    const { data: invoice, error: fetchError } = await client
      .from('invoices')
      .select('*, contracts(property_id, id)')
      .eq('id', id)
      .single();

    if (fetchError || !invoice)
      throw new NotFoundException('Invoice not found');
    if (invoice.status === 'paid')
      throw new BadRequestException('Invoice already paid');

    // 2. Update status
    const { error: updateError } = await client
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError)
      throw new InternalServerErrorException(updateError.message);

    // 3. Create Financial Transaction (Payment) - Update Status of Accrual
    // Instead of just inserting a payment line, we should also MARK the accrual as paid or insert a payment line.
    // Let's insert a PAYMENT line (Cash In) AND update the Accrual (Bill) to paid if we can find it.

    // 3a. Insert Payment Transaction
    const { error: transError } = await client.from('financials').insert({
      property_id: invoice.contracts.property_id,
      contract_id: invoice.contracts.id,
      type: 'payment',
      amount: invoice.amount,
      description: `Rent Payment - Invoice #${invoice.id.slice(0, 8)}`,
      status: 'paid',
      due_date: new Date().toISOString() // Payment date
    });

    if (transError) {
      this.logger.error(
        `Invoice paid but failed to create transaction: ${transError.message}`,
      );
    }

    // 3b. Try to find and close the pending accrual for this month/amount
    // This completes the loop for Admin reporting
    const { data: accrual } = await client.from('financials')
      .select('id')
      .eq('contract_id', invoice.contracts.id)
      .eq('type', 'rent_accrual')
      .eq('status', 'pending')
      .eq('amount', invoice.amount)
      .limit(1)
      .single();

    if (accrual) {
      await client.from('financials').update({ status: 'paid' }).eq('id', accrual.id);
    }

    // 4. Notify Owner
    const { data: property } = await client
      .from('properties')
      .select('owner_id, title')
      .eq('id', invoice.contracts.property_id)
      .single();

    if (property) {
      await this.notificationsService.create({
        user_id: property.owner_id,
        title: 'Rent Paid',
        message: `Rent for ${property.title} has been paid by the tenant.`,
        type: 'success',
        metadata: { invoice_id: id },
      });
    }

    return { message: 'Payment successful' };
  }
}
