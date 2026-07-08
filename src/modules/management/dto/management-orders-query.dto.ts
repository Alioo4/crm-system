import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export enum ManagementTab {
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
}

export enum ManagementPeriod {
  ALL = 'all',
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  CUSTOM = 'custom',
}

export enum ManagementSort {
  OLD = 'old',
  NEW = 'new',
}

export class ManagementOrdersQueryDto {
  @ApiProperty({
    enum: ManagementTab,
    example: ManagementTab.ASSIGNED,
    description:
      "assigned = ishchiga biriktirilgan (Done/Cancel emas), completed = Done",
  })
  @IsEnum(ManagementTab)
  tab: ManagementTab;

  @ApiPropertyOptional({
    enum: ManagementPeriod,
    default: ManagementPeriod.ALL,
  })
  @IsEnum(ManagementPeriod)
  @IsOptional()
  period?: ManagementPeriod = ManagementPeriod.ALL;

  @ApiPropertyOptional({
    enum: ManagementSort,
    default: ManagementSort.NEW,
    description:
      "old = createdAt bo'yicha (eski orderlar, assign date yo'q); new = eng oxirgi assign vaqti bo'yicha",
  })
  @IsEnum(ManagementSort)
  @IsOptional()
  sort?: ManagementSort = ManagementSort.NEW;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000,6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    description: "Vergul bilan ajratilgan ishchi id'lari",
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
        .flatMap((v) => String(v).split(','))
        .map((v) => v.trim())
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  userIds?: string[];

  @ApiPropertyOptional({ example: 1, description: 'Sahifa raqami (1 dan boshlanadi)' })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Sahifadagi elementlar soni' })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
