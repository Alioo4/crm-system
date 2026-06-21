import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  IsInt,
  MaxLength,
} from 'class-validator';

export enum Status {
  MANAGER = 'MANAGER',
  ZAMIR = 'ZAMIR',
  ZAVOD = 'ZAVOD',
  USTANOVCHIK = 'USTANOVCHIK',
  DONE = 'DONE',
  CANCEL = 'CANCEL',
}

export enum PaymentType {
  CARD = 'card',
  CASH = 'cash',
}

export class PaymentItemDto {
  @IsEnum(PaymentType)
  type: PaymentType;

  @IsInt()
  amount: number;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
}

export enum PaymentTypeEnum {
  SALE = 'SALE',
  SALE_ADDITION = 'SALE_ADDITION',
  SALE_CANCEL = 'SALE_CANCEL',
  PREPAYMENT = 'PREPAYMENT',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export class PaymentDto {
  @ApiProperty({
    example: 300000,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    enum: PaymentTypeEnum,
    example: PaymentTypeEnum.PREPAYMENT,
  })
  @IsEnum(PaymentTypeEnum)
  paymentType: PaymentTypeEnum;

  @ApiPropertyOptional({
    example: 'Naqd avans olindi',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'R2 image URLs (receipt/proof photos)',
    example: ['https://pub-xxx.r2.dev/images/uuid1.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

export class OrderHomeFeatureDto {
  @ApiProperty({
    example: 'floor',
    maxLength: 128,
  })
  @IsString()
  @MaxLength(128)
  key: string;

  @ApiProperty({
    example: '2',
    maxLength: 512,
  })
  @IsString()
  @MaxLength(512)
  value: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'Jane Doe', maxLength: 128, required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '+998907654321',
    maxLength: 16,
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'New comment on order',
    maxLength: 256,
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Social Id',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  socialId?: string;

  @ApiPropertyOptional({ example: '2025-04-01T10:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  endDateJob?: Date;

  @ApiPropertyOptional({
    example: '8f5a945a-4c62-437e-95f2-bd45a44d12a7',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  orderStatusId?: string;

  @ApiPropertyOptional({ example: '2025-04-01T10:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  getAllPaymentDate?: Date;

  @ApiPropertyOptional({ example: '2025-04-01T10:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  getPrePaymentDate?: Date;

  @ApiPropertyOptional({
    example: Status.MANAGER,
    enum: Status,
    description: 'Order status',
    required: false,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({
    description: 'Workers coming date',
    example: '2025-04-05T08:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  workerArrivalDate?: Date;

  @ApiPropertyOptional({
    description: 'Total price',
    example: 1200000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({
    description: 'Pre-payment',
    example: 500000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  prePayment?: number;

  @ApiPropertyOptional({
    description: 'Due-amount',
    example: 700000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  dueAmount?: number;

  @ApiPropertyOptional({
    type: [PaymentItemDto],
    example: [
      {
        type: 'card',
        amount: 100000,
      },
      {
        type: 'cash',
        amount: 200000,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  @IsOptional()
  startCurrency?: PaymentItemDto[];

  @ApiPropertyOptional({
    type: [PaymentItemDto],
    example: [
      {
        type: 'card',
        amount: 300000,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  @IsOptional()
  endCurrency?: PaymentItemDto[];

  @ApiProperty({
    description: 'Region Id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  regionId?: string;

  @ApiPropertyOptional({ description: 'Longitude', example: 69.2401 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Latitude', example: 41.3111 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    type: [PaymentDto],
    example: [
      {
        amount: 300000,
        paymentMethod: 'CASH',
        paymentType: 'PREPAYMENT',
        comment: 'Naqd avans olindi',
        imageUrls: ['https://pub-xxx.r2.dev/images/uuid1.jpg'],
      },
      {
        amount: 200000,
        paymentMethod: 'CARD',
        paymentType: 'PREPAYMENT',
        comment: 'Karta orqali avans olindi',
        imageUrls: [
          'https://pub-xxx.r2.dev/images/uuid2.jpg',
          'https://pub-xxx.r2.dev/images/uuid3.jpg',
        ],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments?: PaymentDto[];

  @ApiPropertyOptional({
    description:
      'Home feature list. If sent on update, replaces existing order features.',
    type: [OrderHomeFeatureDto],
    example: [
      { key: 'floor', value: '2' },
      { key: 'entrance', value: 'left side' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderHomeFeatureDto)
  home?: OrderHomeFeatureDto[];

  @ApiPropertyOptional({
    description: 'Hashtag IDs to set (replaces existing list)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  hashtagIds?: string[];
}
