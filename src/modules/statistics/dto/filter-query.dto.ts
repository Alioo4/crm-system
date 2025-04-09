import { Prisma, Status } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StatisticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering statistics (ISO 8601 format)',
    example: '2023-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering statistics (ISO 8601 format)',
    example: '2023-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Status to filter statistics',
    enum: Status,
    example: Status.DONE, 
    default: Status.DONE,
    required: false,
  })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}