import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, OrderQueryDto } from './dto/order.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('member/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('pre')
  getOrderPre(@CurrentUser() user: { id: string }) {
    return this.orderService.getOrderPre(user.id);
  }

  @Post()
  createOrder(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(user.id, dto);
  }

  @Get()
  getOrderList(
    @CurrentUser() user: { id: string },
    @Query() query: OrderQueryDto,
  ) {
    return this.orderService.getOrderList(user.id, query);
  }

  @Get(':id')
  getOrderDetail(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.orderService.getOrderDetail(user.id, id);
  }
}
