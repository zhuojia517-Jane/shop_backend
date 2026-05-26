import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddAddressDto, UpdateAddressDto } from './dto/address.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('member/address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  getAddresses(@CurrentUser() user: { id: string }) {
    return this.addressService.getAddresses(user.id);
  }

  @Post()
  addAddress(
    @CurrentUser() user: { id: string },
    @Body() dto: AddAddressDto,
  ) {
    return this.addressService.addAddress(user.id, dto);
  }

  @Put(':id')
  updateAddress(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.updateAddress(user.id, id, dto);
  }

  @Delete(':id')
  deleteAddress(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.addressService.deleteAddress(user.id, id);
  }
}
