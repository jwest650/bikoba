import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ProductsIndexer } from '../search/products-indexer.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface ListProductsQuery {
  categoryId?: string;
  sellerId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  take?: number;
  skip?: number;
}

const LIST_TTL = 60;
const ITEM_TTL = 300;
const NAMESPACE = 'prod';

const PRODUCT_WITH_CATEGORY = {
  include: { category: { select: { name: true } } },
} satisfies Prisma.ProductDefaultArgs;

type ProductWithCategory = Prisma.ProductGetPayload<typeof PRODUCT_WITH_CATEGORY>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
    private readonly indexer: ProductsIndexer,
  ) {}

  async create(dto: CreateProductDto, caller: AuthenticatedUser): Promise<Product> {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Category does not exist');
    }

    try {
      const created = await this.prisma.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          price: new Prisma.Decimal(dto.price),
          currency: dto.currency ?? 'USD',
          sku: dto.sku,
          stock: dto.stock ?? 0,
          images: dto.images ?? [],
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
          categoryId: dto.categoryId,
          sellerId: caller.id,
        },
        ...PRODUCT_WITH_CATEGORY,
      });
      await this.cache.delByPattern(`${NAMESPACE}:list:*`);
      await this.indexer.upsert(created);
      return stripCategory(created);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        throw new ConflictException(`A product with this ${target} already exists`);
      }
      throw err;
    }
  }

  findAll(query: ListProductsQuery): Promise<Product[]> {
    const take = clamp(query.take, 1, 100, 20);
    const skip = Math.max(0, query.skip ?? 0);
    const key = `${NAMESPACE}:list:${stableKey({
      c: query.categoryId ?? '',
      s: query.sellerId ?? '',
      a: query.isActive ?? '',
      f: query.isFeatured ?? '',
      q: query.search ?? '',
      t: take,
      k: skip,
    })}`;

    return this.cache.wrap(key, LIST_TTL, () => this.runList(query, take, skip));
  }

  async findOne(id: string): Promise<Product> {
    return this.cache.wrap(`${NAMESPACE}:id:${id}`, ITEM_TTL, async () => {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, fullName: true } },
        },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return product;
    });
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    caller: AuthenticatedUser,
  ): Promise<Product> {
    const existing = await this.requireOwnerOrAdmin(id, caller);

    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true },
      });
      if (!category) {
        throw new BadRequestException('Category does not exist');
      }
    }

    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
          currency: dto.currency,
          sku: dto.sku,
          stock: dto.stock,
          images: dto.images,
          isActive: dto.isActive,
          isFeatured: dto.isFeatured,
          categoryId: dto.categoryId,
        },
        ...PRODUCT_WITH_CATEGORY,
      });
      await this.invalidate(id);
      await this.indexer.upsert(updated);
      return stripCategory(updated);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        throw new ConflictException(`A product with this ${target} already exists`);
      }
      throw err;
    }
  }

  async remove(id: string, caller: AuthenticatedUser): Promise<void> {
    await this.requireOwnerOrAdmin(id, caller);
    await this.prisma.product.delete({ where: { id } });
    await this.invalidate(id);
    await this.indexer.remove(id);
  }

  private async runList(
    query: ListProductsQuery,
    take: number,
    skip: number,
  ): Promise<Product[]> {
    if (query.search && this.indexer.isEnabled()) {
      const result = await this.indexer.search({
        query: query.search,
        categoryId: query.categoryId,
        sellerId: query.sellerId,
        isActive: query.isActive,
        isFeatured: query.isFeatured,
        take,
        skip,
      });
      if (result.ids.length === 0) return [];
      const products = await this.prisma.product.findMany({
        where: { id: { in: result.ids } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      return result.ids
        .map((id) => byId.get(id))
        .filter((p): p is Product => p !== undefined);
    }

    const where: Prisma.ProductWhereInput = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (typeof query.isActive === 'boolean') where.isActive = query.isActive;
    if (typeof query.isFeatured === 'boolean') where.isFeatured = query.isFeatured;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  private async invalidate(id: string): Promise<void> {
    await Promise.all([
      this.cache.del(`${NAMESPACE}:id:${id}`),
      this.cache.delByPattern(`${NAMESPACE}:list:*`),
    ]);
  }

  private async requireOwnerOrAdmin(
    id: string,
    caller: AuthenticatedUser,
  ): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (caller.role !== Role.ADMIN && product.sellerId !== caller.id) {
      throw new ForbiddenException('You do not own this product');
    }
    return product;
  }
}

function stripCategory(product: ProductWithCategory): Product {
  const { category: _category, ...rest } = product;
  return rest;
}

function clamp(value: number | undefined, min: number, max: number, fallback: number): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function stableKey(obj: Record<string, unknown>): string {
  return Object.keys(obj)
    .sort()
    .map((k) => `${k}=${String(obj[k])}`)
    .join('|');
}
