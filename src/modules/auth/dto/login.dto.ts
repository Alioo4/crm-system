import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '998990090909',
    description: 'Enter your phone number 📱, max length 16',
  })
  @MaxLength(16)
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    example: 'Ravshanbek98',
    description: 'Enter your password, max length 64',
  })
  @MaxLength(64)
  @IsString()
  @IsNotEmpty()
  password!: string;
}
