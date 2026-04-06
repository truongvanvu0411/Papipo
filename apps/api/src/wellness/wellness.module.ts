import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { WellnessController } from './wellness.controller.js';
import { WellnessService } from './wellness.service.js';

@Module({
  imports: [AuthModule],
  controllers: [WellnessController],
  providers: [WellnessService],
  exports: [WellnessService]
})
export class WellnessModule {}
