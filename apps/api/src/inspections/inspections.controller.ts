import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  @Roles('admin_uk', 'manager', 'agent')
  create(@Body() createInspectionDto: CreateInspectionDto) {
    return this.inspectionsService.create(createInspectionDto);
  }

  @Get()
  @Roles('admin_uk', 'manager', 'agent', 'owner')
  findAll(@Request() req: any) {
    // We know the user role from the guard execution, but better to pass the entire user or specific fields.
    // Currently RolesGuard fetches role but doesn't attach it to req.user (req.user is from JWT).
    // BUT, req.user likely has the role if it's in metadata, OR we rely on re-fetching.
    // The Guard enforces access, so we know they are allowed.
    // Now we need to filter data.
    // To be efficient, let's just pass the userId and let service handle role/filtering or pass explicit role if possible.
    // Since we don't have the role in req.user easily (without DB call), let's let service do it or assume checking ownership.
    // Actually, for "owner", they only see THEIR properties.
    // Admins see all.
    // How to distinguish?
    // We can fetch profile again in service, or rely on client-side sending role (insecure).
    // Best: Fetch profile in service or pass userId.
    return this.inspectionsService.findAll(req.user.sub);
  }

  @Get(':id')
  @Roles('admin_uk', 'manager', 'agent', 'owner')
  findOne(@Param('id') id: string) {
    return this.inspectionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin_uk', 'manager', 'agent')
  update(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
  ) {
    return this.inspectionsService.update(id, updateInspectionDto);
  }
}
