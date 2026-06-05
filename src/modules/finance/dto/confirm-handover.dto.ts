import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class ConfirmHandoverDto {
  @ApiProperty({
    description: 'Tasdiqlash kerak bo\'lgan to\'lov IDlari',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  transactionIds: string[];

  @ApiPropertyOptional({ example: 'Naqd pul qabul qilindi' })
  @IsString()
  @IsOptional()
  note?: string;
}
