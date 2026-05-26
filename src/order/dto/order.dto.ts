import { IsNotEmpty, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class OrderGoodsDto {
  @IsNotEmpty()
  skuId: string;

  @IsInt()
  @Min(1)
  count: number;
}

export class CreateOrderDto {
  @IsOptional()
  deliveryTimeType?: number = 1;

  @IsOptional()
  payType?: number = 1;

  @IsOptional()
  payChannel?: number = 1;

  @IsOptional()
  buyerMessage?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderGoodsDto)
  goods: OrderGoodsDto[];

  @IsNotEmpty({ message: '请选择收货地址' })
  addressId: string;
}

export class OrderQueryDto {
  @IsOptional()
  orderState?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 2;
}
