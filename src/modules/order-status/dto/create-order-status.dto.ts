import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderStatusDto {
  @ApiProperty({
    example: 'Pending',
    description: 'The name of the order status',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 1,
    description: 'The color of the order status',
  })
  @IsInt()
  @IsOptional()
  color?: number;
}
