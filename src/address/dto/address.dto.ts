import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddAddressDto {
  @IsNotEmpty({ message: '收货人不能为空' })
  receiver: string;

  @IsNotEmpty({ message: '联系方式不能为空' })
  contact: string;

  @IsOptional()
  provinceCode?: string;

  @IsOptional()
  cityCode?: string;

  @IsOptional()
  countyCode?: string;

  @IsNotEmpty({ message: '详细地址不能为空' })
  address: string;

  @IsOptional()
  isDefault?: number;

  @IsOptional()
  fullLocation?: string;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  receiver?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  provinceCode?: string;

  @IsOptional()
  cityCode?: string;

  @IsOptional()
  countyCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  isDefault?: number;

  @IsOptional()
  fullLocation?: string;
}
