import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT, RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('Redis');
        const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
        const client = new Redis(url, {
          lazyConnect: false,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => Math.min(times * 200, 2000),
        });

        let lastErrorKey = '';
        client.on('connect', () => {
          lastErrorKey = '';
          logger.log(`Connected to ${url}`);
        });
        client.on('error', (err: NodeJS.ErrnoException) => {
          const code = err.code ?? err.name ?? 'Error';
          const msg = err.message || err.toString();
          const key = `${code}:${msg}`;
          if (key === lastErrorKey) return;
          lastErrorKey = key;
          logger.warn(`${code} — ${msg || '(no message)'}`);
        });
        client.on('end', () => logger.warn('Connection closed'));

        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
