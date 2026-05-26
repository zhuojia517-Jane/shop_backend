import { IsNotEmpty, IsInt, Min } from 'class-validator';

export class AddCartDto {
  @IsNotEmpty({ message: 'skuId不能为空' })
  skuId: string;

  @IsInt()
  @Min(1)
  count: number;
}

export class DeleteCartDto {
  @IsNotEmpty()
  ids: string[];
}

export class MergeCartDto {
  skuId: string;
  count: number;
  selected?: boolean;
}
