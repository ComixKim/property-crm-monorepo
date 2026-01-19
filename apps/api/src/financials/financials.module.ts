import { Module } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { FinancialsController } from './financials.controller';

@Module({
  controllers: [FinancialsController],
  providers: [FinancialsService],
})
export class FinancialsModule {}
