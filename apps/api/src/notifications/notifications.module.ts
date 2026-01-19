import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SupabaseService } from '../supabase.service';

@Global() // Make global so other modules can inject Service easily
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, SupabaseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
