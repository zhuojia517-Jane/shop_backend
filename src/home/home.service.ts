import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  async getBanner(distributionSite: string = '1') {
    return this.prisma.banner.findMany({
      where: { distributionSite },
      select: { id: true, imgUrl: true, hrefUrl: true, type: true },
    });
  }

  async findNew() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        name: true,
        price: true,
        mainPictures: true,
      },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price.toString(),
      picture: p.mainPictures[0] || '',
    }));
  }

  async getHot() {
    const products = await this.prisma.product.findMany({
      orderBy: { salesCount: 'desc' },
      take: 4,
      select: {
        id: true,
        name: true,
        desc: true,
        mainPictures: true,
      },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      desc: p.desc,
      picture: p.mainPictures[0] || '',
    }));
  }

  async getGoods() {
    const categories = await this.prisma.category.findMany({
      where: { layer: 1 },
      select: {
        id: true,
        name: true,
        picture: true,
        children: {
          select: {
            id: true,
            name: true,
            products: {
              take: 6,
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

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      picture: cat.picture,
      children: cat.children.map((child) => ({
        id: child.id,
        name: child.name,
        goods: child.products.map((p) => ({
          id: p.id,
          name: p.name,
          desc: p.desc,
          price: p.price.toString(),
          picture: p.mainPictures[0] || '',
        })),
      })),
    }));
  }

  async getCategoryHead() {
    const categories = await this.prisma.category.findMany({
      where: { layer: 1 },
      select: {
        id: true,
        name: true,
        picture: true,
        children: {
          select: { id: true, name: true, picture: true },
          take: 2,
        },
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
      orderBy: { createdAt: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      picture: cat.picture,
      children: cat.children,
      goods: cat.products.map((p) => ({
        id: p.id,
        name: p.name,
        desc: p.desc,
        price: p.price.toString(),
        picture: p.mainPictures[0] || '',
      })),
    }));
  }
}
