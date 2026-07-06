import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IResponse } from 'src/common/types';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiBearerAuth()
@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi xizmat yaratish' })
  @ApiResponse({ status: 201, description: 'Service successfully created' })
  create(@Body() dto: CreateServiceDto): Promise<IResponse> {
    return this.servicesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha xizmatlarni olish' })
  @ApiResponse({ status: 200, description: 'List of services retrieved successfully' })
  findAll(): Promise<IResponse> {
    return this.servicesService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Xizmatni tahrirlash' })
  @ApiResponse({ status: 200, description: 'Service successfully updated' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Service ID' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<IResponse> {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Xizmatni o'chirish" })
  @ApiResponse({ status: 200, description: 'Service successfully deleted' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Service ID' })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<IResponse> {
    return this.servicesService.remove(id);
  }
}
