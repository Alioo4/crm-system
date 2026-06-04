import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { FinanceDateRangeDto } from './finance-date-range.dto';

export class PaymentsQueryDto extends FinanceDateRangeDto {
  @ApiPropertyOptional({
    description: 'Filter by user who created the transaction (createdBy.id)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
