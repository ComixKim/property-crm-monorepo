import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './contracts/dto/create-contract.dto';
import { UpdateContractDto } from './contracts/dto/update-contract.dto';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

@Controller('contracts')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles('admin_uk', 'manager')
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Get()
  @Roles('admin_uk', 'manager')
  findAll() {
    return this.contractsService.findAll();
  }

  @Get(':id')
  @Roles('admin_uk', 'manager', 'owner', 'tenant', 'agent')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin_uk', 'manager')
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    return this.contractsService.update(id, updateContractDto);
  }

  @Delete(':id')
  @Roles('admin_uk')
  remove(@Param('id') id: string) {
    return this.contractsService.remove(id);
  }
}
