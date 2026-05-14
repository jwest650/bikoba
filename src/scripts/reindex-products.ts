import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { MeiliService } from '../search/meili.service';
import {
  IndexableProduct,
  ProductsIndexer,
} from '../search/products-indexer.service';

const BATCH_SIZE = 500;

async function main(): Promise<void> {
  const logger = new Logger('reindex-products');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const meili = app.get(MeiliService);
    if (!meili.isReady()) {
      logger.error('Meilisearch is not configured/ready — aborting');
      process.exitCode = 1;
      return;
    }

    const prisma = app.get(PrismaService);
    const indexer = app.get(ProductsIndexer);

    const total = await prisma.product.count();
    logger.log(`Reindexing ${total} products in batches of ${BATCH_SIZE}`);

    let cursor: string | undefined;
    let processed = 0;
    while (true) {
      const batch: IndexableProduct[] = await prisma.product.findMany({
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        include: { category: { select: { name: true } } },
      });
      if (batch.length === 0) break;

      await indexer.upsertMany(batch);
      processed += batch.length;
      cursor = batch[batch.length - 1].id;
      logger.log(`Indexed ${processed} / ${total}`);

      if (batch.length < BATCH_SIZE) break;
    }

    logger.log('Reindex complete');
  } catch (err) {
    logger.error(`Reindex failed: ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void main();
