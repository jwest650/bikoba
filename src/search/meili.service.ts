import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Index, MeiliSearch } from 'meilisearch';

export const MEILI_CLIENT = Symbol('MEILI_CLIENT');
export const PRODUCTS_INDEX = 'products';

@Injectable()
export class MeiliService implements OnModuleInit {
  private readonly logger = new Logger(MeiliService.name);
  private ready = false;

  constructor(@Inject(MEILI_CLIENT) private readonly client: MeiliSearch | null) {}

  async onModuleInit(): Promise<void> {
    if (!this.client) {
      this.logger.warn('MEILI_HOST not set — search engine disabled');
      return;
    }
    try {
      await this.client.health();
      await this.bootstrapProductsIndex();
      this.ready = true;
      this.logger.log(`Connected to Meilisearch — index "${PRODUCTS_INDEX}" ready`);
    } catch (err) {
      this.logger.warn(
        `Meilisearch bootstrap failed: ${(err as Error).message}. Search will fall back to Postgres.`,
      );
    }
  }

  isReady(): boolean {
    return this.ready && this.client !== null;
  }

  productsIndex(): Index | null {
    if (!this.isReady() || !this.client) return null;
    return this.client.index(PRODUCTS_INDEX);
  }

  private async bootstrapProductsIndex(): Promise<void> {
    if (!this.client) return;

    const existing = await this.client.getIndexes({ limit: 1000 });
    const found = existing.results.find((i) => i.uid === PRODUCTS_INDEX);
    if (!found) {
      const task = await this.client.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' });
      await this.client.tasks.waitForTask(task.taskUid);
    }

    const index = this.client.index(PRODUCTS_INDEX);
    await index.updateSettings({
      searchableAttributes: ['name', 'description', 'categoryName'],
      filterableAttributes: [
        'categoryId',
        'sellerId',
        'isActive',
        'isFeatured',
        'price',
        'currency',
      ],
      sortableAttributes: ['price', 'createdAt'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    });
  }
}
