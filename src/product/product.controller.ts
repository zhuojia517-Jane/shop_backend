import { Controller, Get, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('goods')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  getDetail(@Query('id') id: string) {
    return this.productService.getDetail(id);
  }

  @Public()
  @Get('hot')
  getHotGoods(
    @Query('id') id: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productService.getHotGoods(id, {
      type: type ? parseInt(type, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 3,
    });
  }

  @Public()
  @Get('relevant')
  getRelevantGoods(@Query('limit') limit?: string) {
    return this.productService.getRelevantGoods(
      limit ? parseInt(limit, 10) : 4,
    );
  }
}
