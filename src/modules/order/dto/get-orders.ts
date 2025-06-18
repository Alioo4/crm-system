import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class GetOrdersDto {
  @ApiProperty({
    description: 'Roʻyxatdagi buyurtma IDlari (UUID formatda)',
    example: ['5f8f8c44-e8c5-4a5a-82a1-123456789abc'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  orderIds: string[];
}
