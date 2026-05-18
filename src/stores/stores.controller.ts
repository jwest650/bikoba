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
import type { Store } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireVerified } from '../auth/decorators/verified.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @RequireVerified()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateStoreDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Store> {
    return this.stores.create(dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @Get()
  findAll(
    @Query('ownerId') ownerId?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('search') search?: string,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ): Promise<Store[]> {
    return this.stores.findAll({ ownerId, isActive, search, take, skip });
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<Store[]> {
    return this.stores.findMine(user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<Store> {
    return this.stores.findBySlug(slug);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @Get(':slug/products')
  findProducts(@Param('slug') slug: string) {
    return this.stores.findProductsForStore(slug);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Store> {
    return this.stores.update(id, dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.stores.remove(id, user);
  }
}
