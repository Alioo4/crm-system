import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RegionsService } from './regions.service';
import { CreateRegionDto, Region } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new region',
    description: 'Adds a new region to the database',
  })
  @ApiResponse({
    status: 201,
    description: 'Region successfully created',
    type: Region,
  })
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all regions',
    description: 'Returns a paginated list of regions',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    example: 'Toshkent',
    description: 'Region nomi bo‘yicha qidirish',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Nechanchi sahifa (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Nechta element olish (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of regions',
    type: [Region],
  })
  findAll(@Query() query: { name?: string; page?: string; limit?: string }) {
    const { name, page = '1', limit = '10' } = query;
    return this.regionsService.findAll(name, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single region',
    description: 'Returns details of a region by ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Region ID',
    example: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Region details', type: Region })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.regionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a region',
    description: "Updates an existing region's details",
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Region ID',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated',
    type: Region,
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateRegionDto: UpdateRegionDto,
  ) {
    return this.regionsService.update(id, updateRegionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a region',
    description: 'Removes a region from the database',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Region ID',
    example: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Successfully deleted' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.regionsService.remove(id);
  }
}
