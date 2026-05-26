import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'asc' },
    });
  }

  async addAddress(userId: string, dto: any) {
    // If this is set as default, clear other defaults first
    if (dto.isDefault === 0) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: 1 },
      });
    }
    const address = await this.prisma.address.create({
      data: { ...dto, userId },
    });
    return address;
  }

  async updateAddress(userId: string, id: string, dto: any) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException({ message: '收货地址不存在', code: '10006' });
    }
    if (dto.isDefault === 0) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: 1 },
      });
    }
    return this.prisma.address.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAddress(userId: string, id: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException({ message: '收货地址不存在', code: '10006' });
    }
    await this.prisma.address.delete({ where: { id } });
    return { id };
  }
}
