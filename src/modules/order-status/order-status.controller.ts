import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrderStatusService } from './order-status.service';
import { CreateOrderStatusDto } from './dto/create-order-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { IResponse } from 'src/common/types';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Order-status')
@Controller('order-status')
export class OrderStatusController {
  constructor(private readonly orderStatusService: OrderStatusService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order status' })
  @ApiResponse({ status: 201, description: 'Status successfully created' })
  @ApiResponse({ status: 400, description: 'Status already exists' })
  create(@Body() createOrderStatusDto: CreateOrderStatusDto): Promise<IResponse> {
    return this.orderStatusService.create(createOrderStatusDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all order statuses' })
  @ApiResponse({ status: 200, description: 'List of statuses retrieved successfully' })
  findAll(): Promise<IResponse> {
    return this.orderStatusService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order status by ID' })
  @ApiResponse({ status: 200, description: 'Status found successfully' })
  @ApiResponse({ status: 400, description: 'Status not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order status ID',  example: '550e8400-e29b-41d4-a716-446655440000' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<IResponse> {
    return this.orderStatusService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing order status' })
  @ApiResponse({ status: 200, description: 'Status successfully updated' })
  @ApiResponse({ status: 400, description: 'Status not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order status ID',  example: '550e8400-e29b-41d4-a716-446655440000' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<IResponse> {
    return this.orderStatusService.update(id, updateOrderStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order status' })
  @ApiResponse({ status: 200, description: 'Status successfully deleted' })
  @ApiResponse({ status: 400, description: 'Status not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Order status ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<IResponse> {
    return this.orderStatusService.remove(id);
  }
}
