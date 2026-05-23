import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentType {
  CARD = 'CARD',
  CASH = 'CASH',
}

export class StatisticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering statistics (ISO 8601 format)',
    example: '2023-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering statistics (ISO 8601 format)',
    example: '2023-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment type: CARD or CASH',
    enum: PaymentType,
    example: PaymentType.CARD,
  })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @ApiPropertyOptional({ description: 'Page number (starts from 1)', example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  limit?: number = 10;
}
