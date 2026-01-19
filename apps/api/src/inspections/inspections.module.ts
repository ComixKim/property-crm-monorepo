import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { SupabaseService } from '../supabase.service';

@Module({
  controllers: [InspectionsController],
  providers: [InspectionsService, SupabaseService],
})
export class InspectionsModule {}
