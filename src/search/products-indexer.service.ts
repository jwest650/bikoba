import { Injectable, Logger } from '@nestjs/common';
import type { Category, Product } from '@prisma/client';
import { MeiliService } from './meili.service';

export interface ProductSearchFilters {
  categoryId?: string;
  sellerId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ProductSearchParams extends ProductSearchFilters {
  query: string;
  take: number;
  skip: number;
}

export interface ProductSearchResult {
  ids: string[];
  total: number;
}

export type IndexableProduct = Product & {
  category: Pick<Category, 'name'> | null;
};

interface ProductDocument {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  sellerId: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: number;
}

@Injectable()
export class ProductsIndexer {
  private readonly logger = new Logger(ProductsIndexer.name);

  constructor(private readonly meili: MeiliService) {}

  isEnabled(): boolean {
    return this.meili.isReady();
  }

  async upsert(product: IndexableProduct): Promise<void> {
    const index = this.meili.productsIndex();
    if (!index) return;
    try {
      await index.addDocuments([toDocument(product)]);
    } catch (err) {
      this.logger.warn(`upsert(${product.id}) failed: ${(err as Error).message}`);
    }
  }

  async upsertMany(products: IndexableProduct[]): Promise<void> {
    const index = this.meili.productsIndex();
    if (!index || products.length === 0) return;
    try {
      await index.addDocumentsInBatches(products.map(toDocument), 1000);
    } catch (err) {
      this.logger.warn(`upsertMany(${products.length}) failed: ${(err as Error).message}`);
    }
  }

  async remove(id: string): Promise<void> {
    const index = this.meili.productsIndex();
    if (!index) return;
    try {
      await index.deleteDocument(id);
    } catch (err) {
      this.logger.warn(`remove(${id}) failed: ${(err as Error).message}`);
    }
  }

  async search(params: ProductSearchParams): Promise<ProductSearchResult> {
    const index = this.meili.productsIndex();
    if (!index) return { ids: [], total: 0 };

    const filter = buildFilter(params);
    const response = await index.search<ProductDocument>(params.query, {
      limit: params.take,
      offset: params.skip,
      filter: filter.length > 0 ? filter : undefined,
      attributesToRetrieve: ['id'],
    });

    return {
      ids: response.hits.map((hit) => hit.id),
      total: response.estimatedTotalHits ?? response.hits.length,
    };
  }
}

function toDocument(product: IndexableProduct): ProductDocument {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price: Number(product.price),
    currency: product.currency,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? '',
    sellerId: product.sellerId,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt.getTime(),
  };
}

function buildFilter(params: ProductSearchFilters): string[] {
  const clauses: string[] = [];
  if (params.categoryId) clauses.push(`categoryId = "${escape(params.categoryId)}"`);
  if (params.sellerId) clauses.push(`sellerId = "${escape(params.sellerId)}"`);
  if (typeof params.isActive === 'boolean') clauses.push(`isActive = ${params.isActive}`);
  if (typeof params.isFeatured === 'boolean') clauses.push(`isFeatured = ${params.isFeatured}`);
  return clauses;
}

function escape(value: string): string {
  return value.replace(/"/g, '\\"');
}
