import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderStatusDto {
  @ApiProperty({
    example: 'Pending',
    description: 'The name of the order status',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty()
  name!: string;
}
