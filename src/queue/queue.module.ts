import { Global, Logger, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor } from './email.processor';
import { SmsProcessor } from './sms.processor';
import { QUEUE_EMAIL, QUEUE_KYC, QUEUE_SMS } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('Queue');
        const raw =
          config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const url = new URL(raw);
        logger.log(`Using Redis at ${url.host}`);
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            username: url.username || undefined,
            password: url.password || undefined,
            // BullMQ requires this to be null for its blocking commands.
            maxRetriesPerRequest: null,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { age: 24 * 3600, count: 1000 },
            removeOnFail: { age: 7 * 24 * 3600 },
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUE_EMAIL },
      { name: QUEUE_KYC },
      { name: QUEUE_SMS },
    ),
  ],
  providers: [EmailProcessor, SmsProcessor],
  exports: [BullModule],
})
export class QueueModule {}
