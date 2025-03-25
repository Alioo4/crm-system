import { Controller, Get, Param } from '@nestjs/common';
import { StatusService } from './status.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get('get-all')
  @ApiOperation({ summary: 'Get all statuses' })
  @ApiResponse({
    status: 200,
    description: 'List of statuses returned successfully.',
  })
  findAll() {
    return this.statusService.findAll();
  }

  @Get('get-one/:id')
  @ApiOperation({ summary: 'Get status by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Status ID' })
  @ApiResponse({ status: 200, description: 'Status found successfully.' })
  @ApiResponse({ status: 404, description: 'Status not found.' })
  findOne(@Param('id') id: string) {
    return this.statusService.findOne(id);
  }
}
