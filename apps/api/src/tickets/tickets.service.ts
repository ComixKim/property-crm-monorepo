import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async create(userId: string, createTicketDto: CreateTicketDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('tickets')
      .insert({
        ...createTicketDto,
        reporter_id: userId,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create ticket: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    // Notify the reporter
    await this.notificationsService.create({
      user_id: userId,
      title: 'Ticket Created',
      message: `Your ticket has been successfully created.`,
      type: 'success',
      metadata: { ticket_id: data.id },
    });

    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from('tickets')
      .select('*, properties(title), profiles:reporter_id(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);

    return data;
  }

  async findForOwner(userId: string) {
    // Tickets for properties owned by this user
    const { data, error } = await this.supabase
      .getClient()
      .from('tickets')
      .select('*, properties!inner(title, owner_id), profiles:reporter_id(full_name, email)')
      .eq('properties.owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findAssignedTickets(userId: string) {
    // Tickets assigned to this user (agent or service)
    const { data, error } = await this.supabase
      .getClient()
      .from('tickets')
      .select('*, properties(title), profiles:reporter_id(full_name, email)')
      .eq('assignee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findMyTickets(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('tickets')
      .select('*, properties(title)')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('tickets')
      .select('*, properties(title), profiles:reporter_id(full_name, email)')
      .eq('id', id)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('tickets')
      .update(updateTicketDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    if (data && updateTicketDto.status) {
      await this.notificationsService.create({
        user_id: data.reporter_id,
        title: 'Ticket Updated',
        message: `Your ticket status has been updated to: ${data.status}`,
        type: 'info',
        metadata: { ticket_id: data.id },
      });
    }

    return data;
  }

  async addComment(ticketId: string, userId: string, content: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        content,
      })
      .select('*, profiles(full_name, email)')
      .single();

    if (error) {
      this.logger.error(`Failed to add comment: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async getComments(ticketId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('ticket_comments')
      .select('*, profiles(full_name, email)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      this.logger.warn(`Profile not found for user ${userId}`);
      return null;
    }
    return data;
  }
}
