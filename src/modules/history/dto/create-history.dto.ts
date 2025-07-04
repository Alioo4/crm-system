import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDate,
} from 'class-validator';

export class CreateHistoryDto {
  @ApiProperty({ example: 'John Doe', description: 'Ism yoki mijoz nomi' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '+998901234567', description: 'Telefon raqami' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Ish jarayoni tugadi', description: 'Izoh' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    example: '2025-03-26T12:00:00.000Z',
    description: 'Ish tugash sanasi',
  })
  @IsOptional()
  @IsDate()
  endDateJob?: Date;

  @ApiProperty({
    example: '2025-03-20T10:00:00.000Z',
    description: 'Ishchi kelish sanasi',
  })
  @IsOptional()
  @IsDate()
  workerArrivalDate?: Date;

  @ApiProperty({ example: 'MANAGER', description: 'Holat', enum: Status })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Buyurtma ID si',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 500000, description: 'Umumiy summa' })
  @IsOptional()
  @IsString()
  total?: number;

  @ApiProperty({ example: 100000, description: 'Oldindan to‘lov miqdori' })
  @IsOptional()
  @IsString()
  prePayment?: number;

  @ApiProperty({ example: 400000, description: 'Qarzdorlik miqdori' })
  @IsOptional()
  @IsString()
  dueAmount?: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Hudud ID si',
  })
  @IsUUID()
  regionId: string | null;

  @ApiProperty({
    example: 69.2163,
    description: 'Longitude (joylashuv koordinatasi)',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: 41.2995,
    description: 'Latitude (joylashuv koordinatasi)',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Ijtimoiy tarmoq ID si',
  })
  @IsUUID()
  socialId: string | null;
}
