import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class RegisterDto {
    @ApiProperty({example: '+998990090909', description: 'Enter your phone number 📱, max length 16'})
    @MaxLength(16)
    @IsString()
    @IsNotEmpty()
    phone!: string;

    @ApiProperty({example: 'John Doe', description: 'Enter your name, max length 64'})
    @MaxLength(64)
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({example: 'Ravshanbek98', description: 'Enter your password, max length 64'})
    @MaxLength(64)
    @IsString()
    @IsNotEmpty()
    password!: string;

    @ApiProperty({example: '33f650cb-660d-48c1-9d34-82b22bcd631d', description: 'Enter your roleId'})
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    roleId!: string;
}
