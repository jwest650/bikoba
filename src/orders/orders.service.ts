import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  OrderStatus,
  Prisma,
  Role,
  type Order,
} from '@prisma/client';
import type { Queue } from 'bullmq';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_EMAIL, QUEUE_SMS } from '../queue/queue.constants';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';

export interface ListOrdersQuery {
  status?: OrderStatus;
  take?: number;
  skip?: number;
}

const ORDER_WITH_RELATIONS = {
  include: {
    items: true,
    store: {
      select: {
        id: true,
        name: true,
        slug: true,
        owner: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            phoneVerifiedAt: true,
          },
        },
      },
    },
    buyer: {
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        phoneVerifiedAt: true,
      },
    },
  },
} satisfies Prisma.OrderDefaultArgs;

type OrderWithRelations = Prisma.OrderGetPayload<typeof ORDER_WITH_RELATIONS>;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_SMS) private readonly smsQueue: Queue,
    @InjectQueue(QUEUE_EMAIL) private readonly emailQueue: Queue,
  ) {}

  async create(dto: CreateOrderDto, buyer: AuthenticatedUser): Promise<Order> {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      select: {
        id: true,
        name: true,
        isActive: true,
        currency: true,
        owner: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            phoneVerifiedAt: true,
          },
        },
      },
    });
    if (!store || !store.isActive) {
      throw new BadRequestException('Store does not exist or is inactive');
    }

    const productIds = Array.from(new Set(dto.items.map((i) => i.productId)));
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        storeId: true,
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products do not exist');
    }
    for (const p of products) {
      if (!p.isActive) {
        throw new BadRequestException(`Product "${p.name}" is not available`);
      }
      if (p.storeId !== dto.storeId) {
        throw new BadRequestException(
          `Product "${p.name}" does not belong to the selected store`,
        );
      }
    }

    // Currency is the store's. Product currency is guaranteed to match by
    // ProductsService — no per-item check needed here.
    const currency = store.currency;

    const productById = new Map(products.map((p) => [p.id, p]));
    let total = new Prisma.Decimal(0);
    const itemRows = dto.items.map((item) => {
      const product = productById.get(item.productId)!;
      const line = product.price.mul(item.quantity);
      total = total.add(line);
      return {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        unitPrice: product.price,
        currency: product.currency,
        quantity: item.quantity,
      };
    });

    // Transaction: conditionally decrement stock for each item, then create
    // the order. A failed decrement (zero rows updated → insufficient stock)
    // throws, rolling back everything including any earlier decrements in
    // this transaction. Safe under concurrent orders for the same product.
    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          const product = productById.get(item.productId)!;
          throw new ConflictException(
            `Insufficient stock for "${product.name}"`,
          );
        }
      }

      return tx.order.create({
        data: {
          buyerId: buyer.id,
          storeId: dto.storeId,
          status: OrderStatus.CONFIRMED,
          totalAmount: total,
          currency,
          shippingAddress: dto.shippingAddress,
          notes: dto.notes,
          items: { create: itemRows },
        },
        include: { items: true },
      });
    });

    await this.enqueueSmsIfPhoneVerified(store.owner, 'order-placed', {
      orderId: order.id,
      itemCount: itemRows.length,
      totalAmount: total.toFixed(2),
      currency,
    });
    await this.enqueueOrderEmail('order-placed-seller', {
      to: store.owner.email,
      storeName: store.name,
      orderId: order.id,
      itemCount: itemRows.length,
      totalAmount: total.toFixed(2),
      currency,
    });

    return order;
  }

  findMine(buyer: AuthenticatedUser, query: ListOrdersQuery): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = { buyerId: buyer.id };
    if (query.status) where.status = query.status;
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: clamp(query.take, 1, 100, 20),
      skip: Math.max(0, query.skip ?? 0),
      include: {
        items: true,
        store: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async findForStore(
    storeId: string,
    caller: AuthenticatedUser,
    query: ListOrdersQuery,
  ): Promise<Order[]> {
    await this.requireCallerOwnsStore(storeId, caller);
    const where: Prisma.OrderWhereInput = { storeId };
    if (query.status) where.status = query.status;
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: clamp(query.take, 1, 100, 20),
      skip: Math.max(0, query.skip ?? 0),
      include: {
        items: true,
        buyer: { select: { id: true, email: true, fullName: true } },
      },
    });
  }

  async findOne(id: string, caller: AuthenticatedUser): Promise<Order> {
    const order = await this.findOneWithRelations(id);
    if (
      caller.role !== Role.ADMIN &&
      order.buyerId !== caller.id &&
      order.store.owner.id !== caller.id
    ) {
      throw new ForbiddenException('You cannot view this order');
    }
    return order;
  }

  async ship(id: string, caller: AuthenticatedUser): Promise<Order> {
    const order = await this.transitionByStoreOwner(
      id,
      caller,
      OrderStatus.CONFIRMED,
      OrderStatus.SHIPPED,
      { shippedAt: new Date() },
    );
    await this.enqueueBuyerSms(order, 'order-shipped');
    await this.enqueueOrderEmail('order-shipped-buyer', {
      to: order.buyer.email,
      storeName: order.store.name,
      orderId: order.id,
    });
    return order;
  }

  async outForDelivery(id: string, caller: AuthenticatedUser): Promise<Order> {
    const order = await this.transitionByStoreOwner(
      id,
      caller,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      { outForDeliveryAt: new Date() },
    );
    await this.enqueueBuyerSms(order, 'order-out-for-delivery');
    await this.enqueueOrderEmail('order-out-for-delivery-buyer', {
      to: order.buyer.email,
      storeName: order.store.name,
      orderId: order.id,
    });
    return order;
  }

  async deliver(id: string, caller: AuthenticatedUser): Promise<Order> {
    return this.transitionByStoreOwner(
      id,
      caller,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      { deliveredAt: new Date() },
    );
  }

  async cancel(
    id: string,
    dto: CancelOrderDto,
    caller: AuthenticatedUser,
  ): Promise<Order> {
    const existing = await this.findOneWithRelations(id);
    if (
      caller.role !== Role.ADMIN &&
      existing.buyerId !== caller.id &&
      existing.store.owner.id !== caller.id
    ) {
      throw new ForbiddenException('You cannot cancel this order');
    }
    if (existing.status !== OrderStatus.CONFIRMED) {
      throw new ConflictException(
        `Cannot cancel an order in ${existing.status} state`,
      );
    }

    // Restore stock for each item in the same transaction as the status flip.
    return this.prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: dto.reason,
        },
        include: ORDER_WITH_RELATIONS.include,
      });
    });
  }

  private async transitionByStoreOwner(
    id: string,
    caller: AuthenticatedUser,
    from: OrderStatus,
    to: OrderStatus,
    extra: Prisma.OrderUpdateInput,
  ): Promise<OrderWithRelations> {
    const existing = await this.findOneWithRelations(id);
    if (
      caller.role !== Role.ADMIN &&
      existing.store.owner.id !== caller.id
    ) {
      throw new ForbiddenException('Only the store owner can update this order');
    }
    if (existing.status !== from) {
      throw new ConflictException(
        `Order must be ${from} to transition to ${to} (current: ${existing.status})`,
      );
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: to, ...extra },
      include: ORDER_WITH_RELATIONS.include,
    });
  }

  private async findOneWithRelations(id: string): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      ...ORDER_WITH_RELATIONS,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private async requireCallerOwnsStore(
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

  private async enqueueBuyerSms(
    order: OrderWithRelations,
    name: 'order-shipped' | 'order-out-for-delivery',
  ): Promise<void> {
    if (!order.buyer.phoneNumber || !order.buyer.phoneVerifiedAt) return;
    try {
      await this.smsQueue.add(name, {
        to: order.buyer.phoneNumber,
        orderId: order.id,
        storeName: order.store.name,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue ${name} SMS: ${(err as Error).message}`,
      );
    }
  }

  private async enqueueSmsIfPhoneVerified(
    owner: { phoneNumber: string | null; phoneVerifiedAt: Date | null },
    name: 'order-placed',
    extraData: Record<string, unknown>,
  ): Promise<void> {
    if (!owner.phoneNumber || !owner.phoneVerifiedAt) return;
    try {
      await this.smsQueue.add(name, { to: owner.phoneNumber, ...extraData });
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue ${name} SMS: ${(err as Error).message}`,
      );
    }
  }

  private async enqueueOrderEmail(
    name:
      | 'order-placed-seller'
      | 'order-shipped-buyer'
      | 'order-out-for-delivery-buyer',
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.emailQueue.add(name, data);
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue ${name} email: ${(err as Error).message}`,
      );
    }
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
