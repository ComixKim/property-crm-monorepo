import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { CreateContractDto } from './contracts/dto/create-contract.dto';
import { UpdateContractDto } from './contracts/dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createContractDto: CreateContractDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('contracts')
      .insert(createContractDto)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from('contracts')
      .select('*, properties(title, address), profiles:tenant_id(full_name)');

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('contracts')
      .select('*, properties(*), profiles:tenant_id(*)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Contract not found');
    return data;
  }

  async update(id: string, updateContractDto: UpdateContractDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('contracts')
      .update(updateContractDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Contract deleted successfully' };
  }
}
