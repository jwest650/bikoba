import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Product } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Product> {
    return this.products.create(dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('sellerId') sellerId?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('isFeatured', new ParseBoolPipe({ optional: true })) isFeatured?: boolean,
    @Query('search') search?: string,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ): Promise<Product[]> {
    return this.products.findAll({
      categoryId,
      sellerId,
      isActive,
      isFeatured,
      search,
      take,
      skip,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.products.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Product> {
    return this.products.update(id, dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.products.remove(id, user);
  }
}
