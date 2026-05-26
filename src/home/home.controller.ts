import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Public()
  @Get('banner')
  getBanner(@Query('distributionSite') distributionSite?: string) {
    return this.homeService.getBanner(distributionSite);
  }

  @Public()
  @Get('new')
  findNew() {
    return this.homeService.findNew();
  }

  @Public()
  @Get('hot')
  getHot() {
    return this.homeService.getHot();
  }

  @Public()
  @Get('goods')
  getGoods() {
    return this.homeService.getGoods();
  }

  @Public()
  @Get('category/head')
  getCategoryHead() {
    return this.homeService.getCategoryHead();
  }
}
