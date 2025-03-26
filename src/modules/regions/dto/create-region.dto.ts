import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'Tashkent', maxLength: 128 })
  @IsString()
  @MaxLength(128)
  name: string;
}

export class Region {
  @ApiProperty({ example: '1', description: 'Regionning unikal ID si' })
  id: string;

  @ApiProperty({ example: 'Toshkent', description: 'Region nomi' })
  name: string;
}

