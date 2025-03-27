import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ZAMIR = 'ZAMIR',
  ZAVOD = 'ZAVOD',
  USTANOVCHIK = 'USTANOVCHIK',
}

export class RegisterDto {
  @ApiProperty({
    example: '998990090909',
    description: 'Enter your phone number 📱, max length 16',
  })
  @MaxLength(16)
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Enter your name, max length 64',
    required: false,
  })
  @MaxLength(64)
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Ravshanbek98',
    description: 'Enter your password, max length 64',
  })
  @MaxLength(64)
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    example: Role.MANAGER,
    enum: Role,
    description: 'Select your role',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role!: Role;
}
