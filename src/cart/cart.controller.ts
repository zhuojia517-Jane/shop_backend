import { Controller, Get, Post, Put, Delete, Body } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartDto, DeleteCartDto } from './dto/cart.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('member/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCartList(@CurrentUser() user: { id: string }) {
    return this.cartService.getCartList(user.id);
  }

  @Post()
  addCart(
    @CurrentUser() user: { id: string },
    @Body() dto: AddCartDto,
  ) {
    return this.cartService.addCart(user.id, dto);
  }

  @Put()
  updateCartItem(
    @CurrentUser() user: { id: string },
    @Body() dto: { skuId: string; selected?: boolean; count?: number },
  ) {
    return this.cartService.updateCartItem(user.id, dto);
  }

  @Put('checkAll')
  checkAllCart(
    @CurrentUser() user: { id: string },
    @Body() dto: { selected: boolean; ids?: string[] },
  ) {
    return this.cartService.checkAllCart(user.id, dto);
  }

  @Delete()
  deleteCart(
    @CurrentUser() user: { id: string },
    @Body() dto: DeleteCartDto,
  ) {
    return this.cartService.deleteCart(user.id, dto.ids);
  }

  @Post('merge')
  mergeCart(
    @CurrentUser() user: { id: string },
    @Body() data: any,
  ) {
    return this.cartService.mergeCart(user.id, Array.isArray(data) ? data : []);
  }
}
