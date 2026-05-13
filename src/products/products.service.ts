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

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto, caller: AuthenticatedUser): Promise<Product> {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Category does not exist');
    }

    try {
      return await this.prisma.product.create({
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
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        throw new ConflictException(`A product with this ${target} already exists`);
      }
      throw err;
    }
  }

  findAll(query: ListProductsQuery): Promise<Product[]> {
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
      take: clamp(query.take, 1, 100, 20),
      skip: Math.max(0, query.skip ?? 0),
    });
  }

  async findOne(id: string): Promise<Product> {
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
      return await this.prisma.product.update({
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
      });
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

function clamp(value: number | undefined, min: number, max: number, fallback: number): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
