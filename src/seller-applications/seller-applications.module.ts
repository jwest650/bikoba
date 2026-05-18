import { Module } from '@nestjs/common';
import { AdminSellerApplicationsController } from './admin-seller-applications.controller';
import { KycScheduler } from './kyc-scheduler.service';
import { KycProcessor } from './kyc.processor';
import { SellerApplicationsController } from './seller-applications.controller';
import { SellerApplicationsService } from './seller-applications.service';

@Module({
  controllers: [
    SellerApplicationsController,
    AdminSellerApplicationsController,
  ],
  providers: [SellerApplicationsService, KycProcessor, KycScheduler],
  exports: [SellerApplicationsService],
})
export class SellerApplicationsModule {}
