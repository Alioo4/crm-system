import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'Yunusobod', maxLength: 128 })
  @IsString()
  @MaxLength(128)
  name: string;
}

export class Region {
  @ApiProperty({ example: '1', description: 'Regionning unikal ID si' })
  id: string;

  @ApiProperty({ example: 'Yunusobod', description: 'Region nomi' })
  name: string;

  @ApiProperty({
    example: '2024-03-26T12:00:00.000Z',
    description: 'Yaratilgan sana',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-03-26T12:30:00.000Z',
    description: 'Yangilangan sana',
  })
  updatedAt: string;
}
