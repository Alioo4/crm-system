import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  IsEnum,
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
  @ApiPropertyOptional({ description: 'Client name', example: 'Devorga suvoq' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '998901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Comment',
    example: 'Iltimos, ertalab 9 da keling',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Ending job date',
    example: '2025-04-10T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDateJob?: Date;

  @ApiPropertyOptional({
    description: 'Workers coming date',
    example: '2025-04-05T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  workerArrivalDate?: Date;

  @ApiPropertyOptional({ description: 'Total price', example: 1200000 })
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiPropertyOptional({ description: 'Pre-payment', example: 500000 })
  @IsOptional()
  @IsNumber()
  prePayment?: number;

  @ApiPropertyOptional({ description: 'Due-amount', example: 700000 })
  @IsOptional()
  @IsNumber()
  dueAmount?: number;

  @ApiProperty({
    description: 'Region Id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  regionId!: string;

  @ApiPropertyOptional({ description: 'Longitude', example: 69.2401 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Latitude', example: 41.3111 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    description: 'Social Id',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  socialId!: string;

  @ApiProperty({
    description: 'Order Status',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  orderStatusId!: string;

  @ApiProperty({
    description: 'Status',
    example: Status.MANAGER,
    enum: Status,
  })
  @IsEnum(Status)
  status!: Status;
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
