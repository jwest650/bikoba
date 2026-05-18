import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Store } from '@prisma/client';
import { Prisma, Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

export interface ListStoresQuery {
  ownerId?: string;
  isActive?: boolean;
  search?: string;
  take?: number;
  skip?: number;
}

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStoreDto, caller: AuthenticatedUser): Promise<Store> {
    try {
      return await this.prisma.store.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          logoUrl: dto.logoUrl,
          bannerUrl: dto.bannerUrl,
          isActive: dto.isActive ?? true,
          currency: dto.currency ?? 'USD',
          ownerId: caller.id,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('A store with this slug already exists');
      }
      throw err;
    }
  }

  findAll(query: ListStoresQuery): Promise<Store[]> {
    const where: Prisma.StoreWhereInput = {};
    if (query.ownerId) where.ownerId = query.ownerId;
    if (typeof query.isActive === 'boolean') where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.store.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: clamp(query.take, 1, 100, 20),
      skip: Math.max(0, query.skip ?? 0),
    });
  }

  findMine(caller: AuthenticatedUser): Promise<Store[]> {
    return this.prisma.store.findMany({
      where: { ownerId: caller.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string): Promise<Store> {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, fullName: true } },
        _count: { select: { products: true } },
      },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async findProductsForStore(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return this.prisma.product.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
  }

  async update(
    id: string,
    dto: UpdateStoreDto,
    caller: AuthenticatedUser,
  ): Promise<Store> {
    await this.requireOwnerOrAdmin(id, caller);
    try {
      return await this.prisma.store.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          logoUrl: dto.logoUrl,
          bannerUrl: dto.bannerUrl,
          isActive: dto.isActive,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('A store with this slug already exists');
      }
      throw err;
    }
  }

  async remove(id: string, caller: AuthenticatedUser): Promise<void> {
    await this.requireOwnerOrAdmin(id, caller);
    await this.prisma.store.delete({ where: { id } });
  }

  async requireCallerOwnsStore(
    storeId: string,
    caller: AuthenticatedUser,
  ): Promise<void> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    if (caller.role !== Role.ADMIN && store.ownerId !== caller.id) {
      throw new ForbiddenException('You do not own this store');
    }
  }

  private async requireOwnerOrAdmin(
    id: string,
    caller: AuthenticatedUser,
  ): Promise<Store> {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    if (caller.role !== Role.ADMIN && store.ownerId !== caller.id) {
      throw new ForbiddenException('You do not own this store');
    }
    return store;
  }
}

function clamp(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
