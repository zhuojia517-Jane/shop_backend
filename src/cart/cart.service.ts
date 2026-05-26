import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private formatCartItem(item: any) {
    return {
      id: item.sku.product.id,
      skuId: item.skuId,
      name: item.sku.product.name,
      attrsText: item.sku.specValues
        .map((sv: any) => `${sv.specValue.spec.name}:${sv.specValue.name}`)
        .join(' '),
      specs: item.sku.specValues.map((sv: any) => sv.specValue.name),
      picture: item.sku.product.mainPictures[0] || '',
      price: item.sku.price.toString(),
      nowPrice: item.sku.price.toString(),
      nowOriginalPrice: item.sku.oldPrice?.toString() ?? item.sku.price.toString(),
      selected: item.selected,
      stock: item.sku.inventory,
      count: item.count,
      isEffective: true,
      discount: null,
      isCollect: false,
      postFee: 9,
    };
  }

  async getCartList(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        sku: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                mainPictures: true,
              },
            },
            specValues: {
              include: {
                specValue: {
                  include: {
                    spec: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => this.formatCartItem(item));
  }

  async addCart(userId: string, dto: { skuId: string; count: number }) {
    const sku = await this.prisma.productSku.findUnique({
      where: { id: dto.skuId },
      include: { product: true },
    });

    if (!sku) {
      throw new NotFoundException({ message: '商品SKU不存在', code: '10006' });
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_skuId: { userId, skuId: dto.skuId } },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { count: existing.count + dto.count },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          userId,
          skuId: dto.skuId,
          count: dto.count,
        },
      });
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { userId_skuId: { userId, skuId: dto.skuId } },
      include: {
        sku: {
          include: {
            product: {
              select: { id: true, name: true, mainPictures: true },
            },
            specValues: {
              include: {
                specValue: {
                  include: {
                    spec: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.formatCartItem(item);
  }

  async deleteCart(userId: string, ids: string[]) {
    await this.prisma.cartItem.deleteMany({
      where: {
        userId,
        skuId: { in: ids },
      },
    });
    return null;
  }

  async updateCartItem(userId: string, dto: { skuId: string; selected?: boolean; count?: number }) {
    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_skuId: { userId, skuId: dto.skuId } },
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

    if (!existing) {
      throw new NotFoundException({ message: '购物车商品不存在', code: '10006' });
    }

    const data: any = {};
    if (dto.selected !== undefined) data.selected = dto.selected;
    if (dto.count !== undefined) data.count = dto.count;

    await this.prisma.cartItem.update({
      where: { id: existing.id },
      data,
    });

    const updated = await this.prisma.cartItem.findUnique({
      where: { id: existing.id },
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

    return this.formatCartItem(updated);
  }

  async checkAllCart(userId: string, dto: { selected: boolean; ids?: string[] }) {
    const where: any = { userId };
    if (dto.ids && dto.ids.length > 0) {
      where.skuId = { in: dto.ids };
    }
    await this.prisma.cartItem.updateMany({
      where,
      data: { selected: dto.selected },
    });
    return null;
  }

  async mergeCart(userId: string, items: { skuId: string; count: number; selected?: boolean }[]) {
    for (const item of items) {
      const existing = await this.prisma.cartItem.findUnique({
        where: { userId_skuId: { userId, skuId: item.skuId } },
      });

      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            count: existing.count + item.count,
            selected: item.selected ?? existing.selected,
          },
        });
      } else {
        await this.prisma.cartItem.upsert({
          where: { userId_skuId: { userId, skuId: item.skuId } },
          update: { count: item.count },
          create: {
            userId,
            skuId: item.skuId,
            count: item.count,
            selected: item.selected ?? true,
          },
        });
      }
    }
    return null;
  }
}
