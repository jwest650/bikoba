import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Category } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

export interface ListCategoriesQuery {
  parentId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    let level = 0;
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        select: { id: true, level: true },
      });
      if (!parent) {
        throw new BadRequestException('Parent category does not exist');
      }
      level = parent.level + 1;
    }

    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          imageUrl: dto.imageUrl,
          icon: dto.icon,
          parentId: dto.parentId,
          level,
          isFeatured: dto.isFeatured ?? false,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('A category with this slug already exists');
      }
      throw err;
    }
  }

  findAll(query: ListCategoriesQuery): Promise<Category[]> {
    const where: Prisma.CategoryWhereInput = {};
    if (query.parentId === null) {
      where.parentId = null;
    } else if (typeof query.parentId === 'string') {
      where.parentId = query.parentId;
    }
    if (typeof query.isActive === 'boolean') where.isActive = query.isActive;
    if (typeof query.isFeatured === 'boolean') where.isFeatured = query.isFeatured;

    return this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { children: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
