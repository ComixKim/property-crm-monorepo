import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Post()
  @Roles('admin_uk', 'manager')
  create(@Body() createDocumentDto: CreateDocumentDto, @Request() req: any) {
    return this.documentsService.create(createDocumentDto, req.user.sub);
  }

  @Get()
  @Roles('admin_uk', 'manager')
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('my')
  findMyShared(@Request() req: any) {
    return this.documentsService.findMyShared(req.user.sub);
  }

  @Patch(':id')
  @Roles('admin_uk', 'manager')
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateDocumentDto>,
  ) {
    return this.documentsService.update(id, updateData);
  }

  @Delete(':id')
  @Roles('admin_uk', 'manager')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
