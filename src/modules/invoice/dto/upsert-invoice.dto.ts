import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class InvoiceItemDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Katalogdagi xizmat ID si',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ example: 150000, description: "Narx (so'm, butun son)" })
  @IsInt()
  @Min(1, { message: 'price must be greater than 0' })
  price!: number;

  @ApiProperty({ example: 2, description: 'Miqdor (kamida 1)' })
  @IsInt()
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;

  @ApiProperty({ example: true, description: 'true — foiz, false — miqdor' })
  @IsBoolean()
  isPercentDiscount!: boolean;

  @ApiProperty({ example: 10, description: "Chegirma qiymati (foiz yoki so'm)" })
  @IsNumber()
  @Min(0)
  discountValue!: number;
}

export class UpsertInvoiceDto {
  @ApiProperty({ type: [InvoiceItemDto], description: "Xizmatlar ro'yxati" })
  @IsArray()
  @ArrayMinSize(1, { message: 'INVOICE_ITEMS_REQUIRED' })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];

  @ApiProperty({ example: false, description: 'Invoice darajasidagi chegirma turi' })
  @IsBoolean()
  isPercentDiscount!: boolean;

  @ApiProperty({ example: 20000, description: 'Invoice darajasidagi chegirma qiymati' })
  @IsNumber()
  @Min(0)
  discountValue!: number;

  @ApiProperty({ example: 'Yetkazib berish bepul', required: false, description: 'Izoh' })
  @IsString()
  @IsOptional()
  comment?: string;
}
