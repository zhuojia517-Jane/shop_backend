import { IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubCategoryGoodsDto {
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  @IsOptional()
  sortField: string = 'publishTime';
}
