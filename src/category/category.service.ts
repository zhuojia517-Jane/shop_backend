import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getCategory(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            products: {
              take: 4,
              select: {
                id: true,
                name: true,
                desc: true,
                price: true,
                mainPictures: true,
              },
            },
          },
        },
      },
    });
  }

  async getSubCategoryFilter(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });
    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      picture: category.picture,
      parentId: category.parentId,
      parentName: category.parent?.name || null,
    };
  }

  async getSubCategoryGoods(dto: {
    categoryId: string;
    page: number;
    pageSize: number;
    sortField?: string;
  }) {
    const { categoryId, page = 1, pageSize = 20, sortField = 'publishTime' } = dto;

    const orderByMap: Record<string, any> = {
      publishTime: { createdAt: 'desc' as const },
      orderNum: { salesCount: 'desc' as const },
      evaluateNum: { commentCount: 'desc' as const },
    };

    const orderBy = orderByMap[sortField] || orderByMap.publishTime;

    const where = { categoryId };

    const [items, counts] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          desc: true,
          price: true,
          mainPictures: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      counts,
      page,
      pageSize,
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        desc: p.desc,
        price: p.price.toString(),
        picture: p.mainPictures[0] || '',
      })),
    };
  }
}
