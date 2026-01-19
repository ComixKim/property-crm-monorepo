import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const { error } = await this.supabase
      .getClient()
      .from('notifications')
      .insert(createNotificationDto);

    if (error) throw new InternalServerErrorException(error.message);
  }

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async listUnread(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async markAsRead(id: string, userId: string) {
    const { error } = await this.supabase
      .getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId); // Security check

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Marked as read' };
  }

  async markAllAsRead(userId: string) {
    const { error } = await this.supabase
      .getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'All marked as read' };
  }
}
