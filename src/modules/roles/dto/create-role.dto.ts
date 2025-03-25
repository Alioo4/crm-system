import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateRoleDto {
    @ApiProperty({example: 'ADMIN', description: 'The name of the role.'})
    @MaxLength(128)
    @IsString()
    @IsNotEmpty()
    name!: string;
}
