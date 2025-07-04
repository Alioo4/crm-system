import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsEnum,
  IsNumber,
} from 'class-validator';

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'Jane Doe', maxLength: 128, required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+998907654321', maxLength: 16, required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'New comment on order', maxLength: 256, required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Social Id',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  socialId?: string | null;

  @ApiPropertyOptional({ example: '2025-04-01T10:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  endDateJob?: Date;

  @ApiPropertyOptional({ example: '8f5a945a-4c62-437e-95f2-bd45a44d12a7', required: false })
  @IsOptional()
  @IsUUID()
  orderStatusId?: string | null;

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

  @ApiPropertyOptional({ description: 'Total price', example: 1200000, required: false })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({ description: 'Pre-payment', example: 500000, required: false })
  @IsNumber()
  @IsOptional()
  prePayment?: number;

  @ApiPropertyOptional({ description: 'Due-amount', example: 700000, required: false })
  @IsNumber()
  @IsOptional()
  dueAmount?: number;

  @ApiProperty({
    description: 'Region Id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  regionId?: string | null;

  @ApiPropertyOptional({ description: 'Longitude', example: 69.2401 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Latitude', example: 41.3111 })
  @IsNumber()
  @IsOptional()
  latitude?: number;
}
