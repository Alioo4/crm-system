import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentType {
  CARD = 'CARD',
  CASH = 'CASH',
}

export class StatisticsQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ enum: PaymentType, example: PaymentType.CARD })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @ApiPropertyOptional({
    description: 'Filter by assignee: managerId, zamirId, zavodId or ustId',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}

export enum WorkerRole {
  MANAGER     = 'MANAGER',
  ZAMIR       = 'ZAMIR',
  ZAVOD       = 'ZAVOD',
  USTANOVCHIK = 'USTANOVCHIK',
}

export class WorkerStatsQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by role: MANAGER | ZAMIR | ZAVOD | USTANOVCHIK',
    enum: WorkerRole,
  })
  @IsEnum(WorkerRole)
  @IsOptional()
  role?: WorkerRole;
}

export class SourceStatsQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific social ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  socialId?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific region ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  regionId?: string;
}
