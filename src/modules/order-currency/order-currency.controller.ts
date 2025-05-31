import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrderCurrencyService } from './order-currency.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCurrencyOrderDto, UpdateOrderCurrencyDto } from './dto';

@ApiTags('Order Currency')
@ApiBearerAuth()
@Controller('order-currency')
export class OrderCurrencyController {
  constructor(private readonly orderCurrencyService: OrderCurrencyService) {}

  @Post()
  @ApiOperation({ summary: 'Create new CurrencyOrder' })
  @ApiResponse({
    status: 201,
    description: 'CurrencyOrder created successfully',
  })
  create(@Body() createOrderCurrencyDto: CreateCurrencyOrderDto) {
    return this.orderCurrencyService.create(createOrderCurrencyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all CurrencyOrders' })
  @ApiResponse({ status: 200, description: 'List of all CurrencyOrders' })
  findAll() {
    return this.orderCurrencyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single CurrencyOrder by ID' })
  @ApiParam({
    name: 'id',
    description: 'CurrencyOrder UUID',
    example: 'f3c3a3fe-9f3d-4c30-bd8a-c4fc376c77fa',
  })
  @ApiResponse({ status: 200, description: 'CurrencyOrder found' })
  @ApiResponse({ status: 404, description: 'CurrencyOrder not found' })
  findOne(@Param('id') id: string) {
    return this.orderCurrencyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update CurrencyOrder by ID' })
  @ApiParam({ name: 'id', description: 'CurrencyOrder UUID' })
  @ApiResponse({
    status: 200,
    description: 'CurrencyOrder updated successfully',
  })
  @ApiResponse({ status: 404, description: 'CurrencyOrder not found' })
  update(
    @Param('id') id: string,
    @Body() updateOrderCurrencyDto: UpdateOrderCurrencyDto,
  ) {
    return this.orderCurrencyService.update(id, updateOrderCurrencyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete CurrencyOrder by ID' })
  @ApiParam({ name: 'id', description: 'CurrencyOrder UUID' })
  @ApiResponse({
    status: 200,
    description: 'CurrencyOrder deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'CurrencyOrder not found' })
  remove(@Param('id') id: string) {
    return this.orderCurrencyService.remove(id);
  }
}
