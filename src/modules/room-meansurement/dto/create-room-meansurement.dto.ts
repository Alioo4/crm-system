import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRoomMeasurementDto {
  @ApiProperty({ example: 'Xona nomi', description: 'O‘lchashda xona nomi' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'height',
    description: 'O‘lchov kaliti (masalan, "height")',
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({
    example: '2.5m',
    description: 'O‘lchov qiymati (masalan, "2.5m")',
  })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Buyurtma ID si',
  })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;
}

export class RoomMeasurement {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Room Measurement ID',
  })
  id: string;

  @ApiProperty({ example: 'Living Room', description: 'Xonaning nomi' })
  name: string;

  @ApiProperty({
    example: 'width',
    description: 'O‘lchov kaliti (masalan, kenglik)',
  })
  key: string;

  @ApiProperty({ example: '4.5m', description: 'O‘lchov qiymati' })
  value: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Order ID',
  })
  orderId: string;

  @ApiProperty({
    example: '2024-03-26T12:00:00Z',
    description: 'Yaratilgan sana',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-26T12:30:00Z',
    description: 'Yangilangan sana',
  })
  updatedAt: Date;
}
