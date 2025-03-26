import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateSocialDto {
  @ApiProperty({ example: 'Telegram', maxLength: 128 })
  @IsString()
  @MaxLength(128)
  name: string;
}

export class Social {
  @ApiProperty({ example: 'uuid', description: 'Social record unique ID' })
  id: string;

  @ApiProperty({ example: 'Twitter', description: 'Social name' })
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
