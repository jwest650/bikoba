import { Global, Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';

@Global()
@Module({
  controllers: [OtpController],
  providers: [SmsService, OtpService],
  exports: [SmsService, OtpService],
})
export class SmsModule {}
