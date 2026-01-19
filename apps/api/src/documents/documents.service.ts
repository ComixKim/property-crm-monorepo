import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async create(createDocumentDto: CreateDocumentDto, userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('documents')
      .insert({
        ...createDocumentDto,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create document: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from('documents')
      .select('*, properties(title), profiles:tenant_id(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findMyShared(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('documents')
      .select('*, properties(title)')
      .or(`tenant_id.eq.${userId},uploaded_by.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(id: string, updateData: Partial<CreateDocumentDto>) {
    const { data, error } = await this.supabase
      .getClient()
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }
}
