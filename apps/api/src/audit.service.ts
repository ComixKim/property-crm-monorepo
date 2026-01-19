import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

export interface AuditLogEntry {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly supabase: SupabaseService) {}

  async log(entry: AuditLogEntry) {
    // Fire and forget, or await if critical
    await this.supabase.getClient().from('audit_logs').insert(entry);
  }

  async findAll(limit = 100) {
    const { data } = await this.supabase
      .getClient()
      .from('audit_logs')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data;
  }
}
