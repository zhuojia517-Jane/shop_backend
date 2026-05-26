import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { account: loginDto.account },
    });

    if (!user) {
      throw new UnauthorizedException({ message: '用户不存在', code: '17001' });
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({ message: '密码错误', code: '17002' });
    }

    const payload = { sub: user.id, account: user.account };
    const token = this.jwtService.sign(payload);

    return {
      id: user.id,
      account: user.account,
      mobile: user.mobile,
      token,
      avatar: user.avatar,
      nickname: user.nickname,
      gender: user.gender,
      birthday: user.birthday,
      cityCode: user.cityCode,
      provinceCode: user.provinceCode,
      profession: user.profession,
    };
  }
}
