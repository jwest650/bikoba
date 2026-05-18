import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, type Order } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireVerified } from '../auth/decorators/verified.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @UseGuards(EmailVerifiedGuard)
  @RequireVerified()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.create(dto, user);
  }

  @Get('me')
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status', new ParseEnumPipe(OrderStatus, { optional: true }))
    status?: OrderStatus,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ): Promise<Order[]> {
    return this.orders.findMine(user, { status, take, skip });
  }

  @Get('store/:storeId')
  findForStore(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('status', new ParseEnumPipe(OrderStatus, { optional: true }))
    status?: OrderStatus,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ): Promise<Order[]> {
    return this.orders.findForStore(storeId, user, { status, take, skip });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.findOne(id, user);
  }

  @Post(':id/ship')
  @HttpCode(HttpStatus.OK)
  ship(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.ship(id, user);
  }

  @Post(':id/out-for-delivery')
  @HttpCode(HttpStatus.OK)
  outForDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.outForDelivery(id, user);
  }

  @Post(':id/deliver')
  @HttpCode(HttpStatus.OK)
  deliver(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.deliver(id, user);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.cancel(id, dto, user);
  }
}
