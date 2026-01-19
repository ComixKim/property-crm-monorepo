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
import { NotificationsService } from './notifications.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.notificationsService.findAll(req.user.sub);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  // Internal use or Admin only?
  // For now, no public exposed CREATE endpoint. Service methods can be called by other modules.
}
