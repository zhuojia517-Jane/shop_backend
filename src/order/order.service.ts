import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  private readonly COUNTDOWN_SECONDS = 900; // 15 minutes

  constructor(private prisma: PrismaService) {}

  async getOrderPre(userId: string) {
    // Get addresses
    const userAddresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'asc' },
    });

    // Get selected cart items
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId, selected: true },
      include: {
        sku: {
          include: {
            product: {
              select: { id: true, name: true, mainPictures: true },
            },
            specValues: {
              include: {
                specValue: {
                  include: { spec: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    const goods = cartItems.map((item) => {
      const attrsText = item.sku.specValues
        .map((sv) => `${sv.specValue.spec.name}：${sv.specValue.name}`)
        .join(' ');

      const price = Number(item.sku.price);
      const totalPrice = price * item.count;
      const totalPayPrice = totalPrice;
      const picture = item.sku.product.mainPictures[0] || '';

      return {
        id: item.sku.product.id,
        skuId: item.skuId,
        name: item.sku.product.name,
        picture,
        price: price.toFixed(2),
        count: item.count,
        attrsText,
        totalPrice: totalPrice.toFixed(2),
        totalPayPrice: totalPayPrice.toFixed(2),
      };
    });

    const summary = {
      goodsCount: goods.reduce((s, g) => s + g.count, 0),
      totalPrice: goods.reduce((s, g) => s + Number(g.totalPrice), 0).toFixed(2),
      postFee: '0.00',
      discount: '0.00',
      totalPayPrice: goods.reduce((s, g) => s + Number(g.totalPayPrice), 0).toFixed(2),
    };

    return { userAddresses, goods, summary };
  }

  async createOrder(userId: string, dto: any) {
    // Validate address
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) {
      throw new BadRequestException({ message: '收货地址不存在', code: '10006' });
    }

    // Fetch and validate goods
    let totalMoney = 0;
    let totalPayMoney = 0;
    let totalNum = 0;
    const orderItems: any[] = [];

    for (const g of dto.goods) {
      const sku = await this.prisma.productSku.findUnique({
        where: { id: g.skuId },
        include: {
          product: {
            select: { id: true, name: true, mainPictures: true },
          },
          specValues: {
            include: {
              specValue: {
                include: { spec: { select: { name: true } } },
              },
            },
          },
        },
      });

      if (!sku) {
        throw new BadRequestException({ message: `SKU ${g.skuId} 不存在`, code: '10006' });
      }
      if (sku.inventory < g.count) {
        throw new BadRequestException({ message: `${sku.product.name} 库存不足`, code: '10010' });
      }

      const price = Number(sku.price);
      const lineTotal = price * g.count;
      totalMoney += lineTotal;
      totalPayMoney += lineTotal;
      totalNum += g.count;

      const attrsText = sku.specValues
        .map((sv) => `${sv.specValue.spec.name}：${sv.specValue.name}`)
        .join(' ');

      orderItems.push({
        skuId: sku.id,
        productId: sku.product.id,
        name: sku.product.name,
        picture: sku.product.mainPictures[0] || '',
        price,
        count: g.count,
        attrsText,
        realPay: price,
      });
    }

    // Create order with items in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          addressId: dto.addressId,
          orderState: 1, // 待付款
          payMoney: totalPayMoney,
          totalMoney,
          totalPayMoney,
          totalNum,
          postFee: 0,
          payType: dto.payType || 1,
          payChannel: dto.payChannel || 1,
          buyerMessage: dto.buyerMessage || '',
          deliveryTimeType: dto.deliveryTimeType || 1,
          countdown: this.COUNTDOWN_SECONDS,
          createTime: new Date(),
          items: {
            create: orderItems,
          },
        },
      });

      // Deduct inventory
      for (const g of dto.goods) {
        await tx.productSku.update({
          where: { id: g.skuId },
          data: { inventory: { decrement: g.count } },
        });
      }

      // Clear selected cart items
      const skuIds = dto.goods.map((g: any) => g.skuId);
      await tx.cartItem.deleteMany({
        where: { userId, skuId: { in: skuIds } },
      });

      return created;
    });

    return { id: order.id };
  }

  async getOrderList(userId: string, query: { orderState?: number; page?: number; pageSize?: number }) {
    const { orderState = 0, page = 1, pageSize = 2 } = query;
    const where: any = { userId };
    if (orderState > 0) {
      where.orderState = orderState;
    }

    const [items, counts] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            include: {
              sku: {
                select: { id: true },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const result = items.map((order) => ({
      id: order.id,
      createTime: order.createTime,
      orderState: order.orderState,
      countdown: order.countdown,
      payMoney: Number(order.payMoney),
      totalMoney: Number(order.totalMoney),
      totalNum: order.totalNum,
      postFee: Number(order.postFee),
      skus: order.items.map((item) => ({
        id: item.skuId,
        image: item.picture,
        name: item.name,
        attrsText: item.attrsText,
        realPay: Number(item.realPay),
        quantity: item.count,
      })),
    }));

    return { counts, page, pageSize, items: result };
  }

  async getOrderDetail(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException({ message: '订单不存在', code: '10006' });
    }

    return {
      id: order.id,
      createTime: order.createTime,
      orderState: order.orderState,
      countdown: order.countdown,
      payMoney: Number(order.payMoney),
      totalMoney: Number(order.totalMoney),
      totalNum: order.totalNum,
      postFee: Number(order.postFee),
      payType: order.payType,
      payChannel: order.payChannel,
      buyerMessage: order.buyerMessage,
      deliveryTimeType: order.deliveryTimeType,
      skus: order.items.map((item) => ({
        id: item.skuId,
        image: item.picture,
        name: item.name,
        attrsText: item.attrsText,
        realPay: Number(item.realPay),
        quantity: item.count,
      })),
    };
  }
}
