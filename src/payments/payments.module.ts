import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { AdminReconciliationsController } from './admin-reconciliations.controller';
import { PaymentsController } from './payments.controller';
import { PaymentsProcessor } from './payments.processor';
import { PaymentsScheduler } from './payments.scheduler';
import { PaymentsService } from './payments.service';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import { PaystackProvider } from './providers/paystack.provider';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController, AdminReconciliationsController],
  providers: [
    PaymentsService,
    PaystackProvider,
    FlutterwaveProvider,
    PaymentsProcessor,
    PaymentsScheduler,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
