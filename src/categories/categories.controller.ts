import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Category } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categories.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @Get()
  findAll(
    @Query('parentId') parentId?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('isFeatured', new ParseBoolPipe({ optional: true })) isFeatured?: boolean,
  ): Promise<Category[]> {
    return this.categories.findAll({
      parentId: parentId === 'null' ? null : parentId,
      isActive,
      isFeatured,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<Category> {
    return this.categories.findBySlug(slug);
  }
}
