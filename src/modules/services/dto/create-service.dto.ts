import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Jaluzi',
    description: 'Xizmat nomi',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'Plisse Xitoy',
    description: "Qo'shimcha tavsif",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 150000,
    description: "Standart narx (so'm). Invoice qo'shganda avtomatik to'ldiriladi.",
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  defaultPrice?: number;
}
