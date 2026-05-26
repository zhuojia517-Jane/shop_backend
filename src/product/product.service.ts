import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async getDetail(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
        specs: {
          include: {
            values: true,
          },
        },
        skus: {
          include: {
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
        detailProps: true,
        detailPics: true,
      },
    });

    if (!product) {
      throw new NotFoundException({ message: '商品不存在', code: '10006' });
    }

    // Build categories array: leaf → root
    const categories: any[] = [];
    let cat: any = product.category;
    while (cat) {
      categories.unshift({
        id: cat.id,
        name: cat.name,
        layer: cat.layer,
        parent: cat.parent
          ? { id: cat.parent.id, name: cat.parent.name, layer: cat.parent.layer, parent: null }
          : null,
      });
      cat = cat.parent;
    }

    return {
      id: product.id,
      name: product.name,
      spuCode: product.spuCode,
      desc: product.desc,
      price: product.price.toString(),
      oldPrice: product.oldPrice?.toString() ?? product.price.toString(),
      discount: product.discount,
      inventory: product.inventory,
      brand: product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
            nameEn: product.brand.nameEn,
            logo: product.brand.logo,
            picture: product.brand.picture,
            type: product.brand.type,
            desc: product.brand.desc,
            place: product.brand.place,
          }
        : null,
      salesCount: product.salesCount,
      commentCount: product.commentCount,
      collectCount: product.collectCount,
      mainVideos: product.mainVideos,
      videoScale: product.videoScale,
      mainPictures: product.mainPictures,
      specs: product.specs.map((spec) => ({
        name: spec.name,
        id: spec.id,
        values: spec.values.map((v) => ({
          name: v.name,
          picture: v.picture,
          desc: v.desc,
        })),
      })),
      skus: product.skus.map((sku) => ({
        id: sku.id,
        skuCode: sku.skuCode,
        price: sku.price.toString(),
        oldPrice: sku.oldPrice?.toString() ?? sku.price.toString(),
        inventory: sku.inventory,
        specs: sku.specValues.map((sv) => ({
          name: sv.specValue.spec.name,
          valueName: sv.specValue.name,
        })),
      })),
      categories,
      details: {
        pictures: product.detailPics.map((pic) => pic.url),
        properties: product.detailProps.map((prop) => ({
          name: prop.name,
          value: prop.value,
        })),
      },
      isPreSale: product.isPreSale,
      isCollect: null,
      recommends: null,
      userAddresses: null,
      similarProducts: [],
      hotByDay: [],
      evaluationInfo: null,
    };
  }

  async getHotGoods(id: string, dto: { type?: number; limit?: number }) {
    const { type = 1, limit = 3 } = dto;
    const orderBy = type === 2
      ? { salesCount: 'desc' as const }
      : { salesCount: 'desc' as const };

    const goods = await this.prisma.product.findMany({
      where: {
        id: { not: id },
      },
      orderBy,
      take: limit,
      select: {
        id: true,
        name: true,
        desc: true,
        price: true,
        mainPictures: true,
        salesCount: true,
      },
    });

    return goods.map((g) => ({
      id: g.id,
      name: g.name,
      desc: g.desc,
      price: g.price.toString(),
      picture: g.mainPictures[0] || '',
      discount: null,
      orderNum: g.salesCount,
    }));
  }

  async getRelevantGoods(limit: number = 4) {
    const goods = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        desc: true,
        price: true,
        mainPictures: true,
      },
    });

    return goods.map((g) => ({
      id: g.id,
      name: g.name,
      desc: g.desc,
      price: g.price.toString(),
      picture: g.mainPictures[0] || '',
    }));
  }
}
