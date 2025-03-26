import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ZAMIR = 'ZAMIR',
  ZAVOD = 'ZAVOD',
  USTANOVCHIK = 'USTANOVCHIK',
}

export class UpdateUserDto {
  @ApiProperty({
    example: '998990090909',
    description: 'Enter your phone number 📱, max length 16',
    required: false,
  })
  @MaxLength(16)
  @IsString()
  @IsOptional()
  phone?: string;

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
    required: false,
  })
  @MaxLength(64)
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    example: Role.ADMIN,
    enum: Role,
    description: 'Select your role',
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
