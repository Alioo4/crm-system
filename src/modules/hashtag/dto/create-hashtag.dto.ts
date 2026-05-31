import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateHashtagDto {
  @ApiProperty({ example: 'dizayn', description: 'Hashtag nomi', maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;
}
