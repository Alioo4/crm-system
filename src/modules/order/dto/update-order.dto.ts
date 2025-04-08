import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsEnum,
  IsNumber,
} from 'class-validator';

export enum Status {
  MANAGER = 'MANAGER',
  ZAMIR = 'ZAMIR',
  ZAVOD = 'ZAVOD',
  USTANOVCHIK = 'USTANOVCHIK',
  DONE = 'DONE',
  CANCEL = 'CANCEL',
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'Jane Doe', maxLength: 128 })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+998907654321', maxLength: 16 })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'New comment on order', maxLength: 256 })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Social Id',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  socialId?: string;

  @ApiPropertyOptional({ example: '2025-04-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDateJob?: Date;

  @ApiPropertyOptional({ example: '8f5a945a-4c62-437e-95f2-bd45a44d12a7' })
  @IsOptional()
  @IsUUID()
  orderStatusId?: string;

  @ApiPropertyOptional({
    example: Status.MANAGER,
    enum: Status,
    description: 'Order status',
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({
    description: 'Workers coming date',
    example: '2025-04-05T08:00:00.000Z',
  })
  @IsDateString()
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
  @IsOptional()
  regionId?: string;
}
