import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsString,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateCurrencyOrderDto {
  @ApiPropertyOptional({
    description: 'Currency order name',
    maxLength: 128,
    example: 'USD Order',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Amount on card',
    minimum: 0,
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  card?: number;

  @ApiPropertyOptional({
    description: 'Amount in cash',
    minimum: 0,
    example: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  cash?: number;

  @ApiProperty({
    description: 'Indicates if this is a pre-payment',
    example: true,
  })
  @IsBoolean()
  isPrePayment: boolean;

  @ApiProperty({
    description: 'Related order ID (UUID)',
    example: 'b2c5fe1a-1db1-4c0b-b2fd-3875e54b18df',
  })
  @IsUUID()
  orederId: string;
}
