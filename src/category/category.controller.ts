import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { CategoryService } from './category.service';
import { SubCategoryGoodsDto } from './dto/sub-category-goods.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  getCategory(@Query('id') id: string) {
    return this.categoryService.getCategory(id);
  }

  @Public()
  @Get('sub/filter')
  getSubCategoryFilter(@Query('id') id: string) {
    return this.categoryService.getSubCategoryFilter(id);
  }

  @Public()
  @Post('goods/temporary')
  getSubCategoryGoods(@Body() dto: SubCategoryGoodsDto) {
    return this.categoryService.getSubCategoryGoods(dto);
  }
}
