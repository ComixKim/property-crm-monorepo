import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { CreatePropertyDto } from './properties/dto/create-property.dto';
import { UpdatePropertyDto } from './properties/dto/update-property.dto';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async create(createPropertyDto: CreatePropertyDto) {
    this.logger.log(`Creating new property: ${createPropertyDto.title}`);

    const { data, error } = await this.supabase
      .getClient()
      .from('properties')
      .insert({
        ...createPropertyDto,
        status: createPropertyDto.status || 'draft',
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create property: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from('properties')
      .select('*');

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Property not found');
    return data;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('properties')
      .update(updatePropertyDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Property deleted successfully' };
  }
}
