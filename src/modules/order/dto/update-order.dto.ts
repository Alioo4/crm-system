import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';

export enum Status {
  MANAGER = 'MANAGER',
  ZAMIR = 'ZAMIR',
  ZAVOD = 'ZAVOD',
  USTANOVCHIK = 'USTANOVCHIK',
  DONE = 'DONE',
  CANCEL = 'CANCEL',
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'Jane Doe', maxLength: 128 })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+998907654321', maxLength: 16 })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'New comment on order', maxLength: 256 })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: 'Social Media', maxLength: 128 })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: '2025-04-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDateJob?: Date;

  @ApiPropertyOptional({ example: '8f5a945a-4c62-437e-95f2-bd45a44d12a7' })
  @IsOptional()
  @IsUUID()
  orderStatusId?: string;

  @ApiPropertyOptional({
    example: Status.MANAGER,
    enum: Status,
    description: 'Order status',
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
