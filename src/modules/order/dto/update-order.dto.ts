import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';

export class UpdateOrderDto {
    @ApiProperty({ example: 'Jane Doe', maxLength: 128, required: false })
    @IsOptional()
    @IsString()
    name?: string;
  
    @ApiProperty({ example: '+998907654321', maxLength: 16, required: false })
    @IsOptional()
    @IsString()
    phone?: string;
  
    @ApiProperty({ example: 'New comment on order', maxLength: 256, required: false })
    @IsOptional()
    @IsString()
    comment?: string;
  
    @ApiProperty({ example: 'Social Media', maxLength: 128, required: false })
    @IsOptional()
    @IsString()
    source?: string;
  
    @ApiProperty({ example: '2025-04-01T10:00:00.000Z', required: false })
    @IsOptional()
    @IsDateString()
    endDateJob?: Date;
  
    @ApiProperty({ example: '8f5a945a-4c62-437e-95f2-bd45a44d12a7', required: false })
    @IsOptional()
    @IsUUID()
    orderStatusId?: string;
  
    @ApiProperty({ example: '9b2a7cfb-d67f-4f99-83e7-ec60b81f2b27', required: false })
    @IsOptional()
    @IsUUID()
    statusId?: string;
  }
