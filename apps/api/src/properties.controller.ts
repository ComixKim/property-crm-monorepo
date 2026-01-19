import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './properties/dto/create-property.dto';
import { UpdatePropertyDto } from './properties/dto/update-property.dto';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

@Controller('properties')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @Roles('admin_uk', 'manager') // Only staff can create properties initially
  create(@Body() createPropertyDto: CreatePropertyDto, @Req() req: any) {
    // Optionally assign current user as owner if not provided
    if (!createPropertyDto.owner_id && req.user.sub) {
      // Warning: Usually admin creates property for an owner.
      // Logic depends on requirements. For now, allow simple create.
    }
    return this.propertiesService.create(createPropertyDto);
  }

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin_uk', 'manager', 'owner')
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @Roles('admin_uk')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
