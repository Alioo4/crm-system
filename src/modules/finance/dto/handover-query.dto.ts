import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class HandoverQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific worker (createdBy.id)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'true → only pending | false → only handed-over | (none) → all',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true')  return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  pending?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
