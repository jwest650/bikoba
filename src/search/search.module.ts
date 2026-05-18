import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';
import { MEILI_CLIENT, MeiliService } from './meili.service';
import { ProductsIndexer } from './products-indexer.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MEILI_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Meilisearch | null => {
        const logger = new Logger('Meili');
        const host = config.get<string>('MEILI_HOST');
        if (!host) {
          logger.warn('MEILI_HOST not configured');
          return null;
        }
        return new Meilisearch({
          host,
          apiKey: config.get<string>('MEILI_MASTER_KEY'),
        });
      },
    },
    MeiliService,
    ProductsIndexer,
  ],
  exports: [MeiliService, ProductsIndexer],
})
export class SearchModule {}
