import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { HistoryService } from './history.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all histories with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'regionName', required: false, type: String })
  @ApiQuery({ name: 'socialName', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('regionName') regionName?: string,
    @Query('socialName') socialName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.historyService.findAll(
      page,
      limit,
      search,
      regionName,
      socialName,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a history record by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'UUID of the history record',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the history record',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'History record not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.historyService.findOne(id);
  }
}
