import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { SupabaseModule } from './supabase.module';
import { SupabaseService } from './supabase.service';
import { PropertiesModule } from './properties.module';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { ContractsModule } from './contracts.module';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { AuditModule } from './audit.module';
import { TicketsModule } from './tickets/tickets.module';
import { FinancialsModule } from './financials/financials.module';
import { AuditService } from './audit.service';
import { UsersModule } from './users/users.module';
import { InspectionsModule } from './inspections/inspections.module';
import { InvoicesModule } from './invoices/invoices.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SupabaseModule,
    PropertiesModule,
    ContractsModule,
    AuditModule,
    TicketsModule,
    FinancialsModule,
    UsersModule,
    InspectionsModule,
    InvoicesModule,
    NotificationsModule,
    DocumentsModule,
  ],
  controllers: [AppController, PropertiesController, ContractsController],
  providers: [AppService, PropertiesService, ContractsService, AuditService],
})
export class AppModule {}
