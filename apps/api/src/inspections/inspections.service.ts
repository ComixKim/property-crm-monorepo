import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InspectionsService {
  private readonly logger = new Logger(InspectionsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createInspectionDto: CreateInspectionDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('inspections')
      .insert(createInspectionDto)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create inspection: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    // Notify Owner
    const { data: property } = await this.supabase
      .getClient()
      .from('properties')
      .select('owner_id, title')
      .eq('id', data.property_id)
      .single();

    if (property) {
      await this.notificationsService.create({
        user_id: property.owner_id,
        title: 'Inspection Scheduled',
        message: `A new inspection has been scheduled for your property: ${property.title}`,
        type: 'info',
        metadata: { inspection_id: data.id },
      });
    }

    return data;
  }

  async findAll(userId?: string) {
    const client = this.supabase.getClient();

    // 1. Check Role if userId provided
    let isOwner = false;
    if (userId) {
      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (profile?.role === 'owner') isOwner = true;
    }

    let query = client
      .from('inspections')
      .select(
        '*, properties!inner(id, title, address, owner_id), profiles:agent_id(full_name, email)',
      ) // Inner join to filter by property properties
      .order('date', { ascending: true });

    // 2. Filter if Owner
    if (isOwner && userId) {
      query = query.eq('properties.owner_id', userId);
    }

    const { data, error } = await query;

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('inspections')
      .select(
        '*, properties(title, address), profiles:agent_id(full_name, email)',
      )
      .eq('id', id)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(id: string, updateInspectionDto: UpdateInspectionDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('inspections')
      .update(updateInspectionDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
