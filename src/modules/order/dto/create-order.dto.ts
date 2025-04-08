import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export enum Status {
  MANAGER = 'MANAGER',
  ZAMIR = 'ZAMIR',
  ZAVOD = 'ZAVOD',
  USTANOVCHIK = 'USTANOVCHIK',
  DONE = 'DONE',
  CANCEL = 'CANCEL',
}

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'Client name', example: 'Ravshanbek' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '998901234567' })
  @IsString()
  @IsNotEmpty() 
  phone: string;

  @ApiPropertyOptional({
    description: 'Comment',
    example: 'Iltimos, ertalab 9 da keling',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Ending job date',
    example: '2025-04-10T08:00:00.000Z',
  })
  @IsDateString()
  @Transform(({ value }) => (value?.trim() === '' ? undefined : value))
  @IsOptional()
  endDateJob?: Date;

  @ApiPropertyOptional({
    description: 'Workers coming date',
    example: '2025-04-05T08:00:00.000Z',
  })
  @IsDateString()
  @Transform(({ value }) => (value?.trim() === '' ? undefined : value))
  @IsOptional()
  workerArrivalDate?: Date;

  @ApiPropertyOptional({ description: 'Total price', example: 1200000 })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({ description: 'Pre-payment', example: 500000 })
  @IsNumber()
  @IsOptional()
  prePayment?: number;

  @ApiPropertyOptional({ description: 'Due-amount', example: 700000 })
  @IsNumber()
  @IsOptional()
  dueAmount?: number;

  @ApiProperty({
    description: 'Region Id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  regionId?: string;

  @ApiPropertyOptional({ description: 'Longitude', example: 69.2401 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Latitude', example: 41.3111 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    description: 'Social Id',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  socialId?: string;

  @ApiProperty({
    description: 'Order Status',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  orderStatusId?: string;

  @ApiProperty({
    description: 'Status',
    example: Status.MANAGER,
    enum: Status,
  })
  @IsEnum(Status)
  @Transform(({ value }) => (value?.trim() === '' ? undefined : value))
  @IsOptional()
  status?: Status;
}

export class ResponseOrderPosDto<T = any> {
  @ApiProperty({ example: true, description: 'Operation status' })
  success: boolean;

  @ApiProperty({
    example: 'Successfully messages',
    description: 'Message about the operation',
  })
  message: string;

  @ApiProperty({ description: 'Response data', nullable: true })
  data?: T;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}

export class ResponseOrderNegDto<T = any> {
  @ApiProperty({ example: false, description: 'Operation status' })
  success: boolean;

  @ApiProperty({
    example: 'Unsuccessfully messages',
    description: 'Message about the operation',
  })
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}
