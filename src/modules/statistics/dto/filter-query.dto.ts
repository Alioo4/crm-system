import { Status } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
    description: 'Search by name and phone in workers',
    example: '998332218888',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

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

  @ApiPropertyOptional({
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Limit of items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  limit?: number = 10;
}
