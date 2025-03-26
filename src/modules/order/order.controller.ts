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
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  ResponseOrderNegDto,
  ResponseOrderPosDto,
} from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IResponse, ResponseDto } from 'src/common/types';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';
import { User } from 'src/common/decorators/get-user.decarator';

@ApiBearerAuth()
@ApiTags('Order')
@ApiExtraModels(ResponseDto)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiCreatedResponse({
    description: 'Order successfully created',
    type: ResponseOrderPosDto,
  })
  create(@Body() createOrderDto: CreateOrderDto): Promise<IResponse> {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiOkResponse({
    description: 'List of orders retrieved successfully',
    type: ResponseOrderPosDto,
  })
  findAll(@User() user: {sub: string, role: string}): Promise<IResponse> {
    return this.orderService.findAll(user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order by ID' })
  @ApiOkResponse({
    description: 'Order found successfully',
    type: ResponseOrderPosDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ResponseOrderNegDto,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Order ID',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<IResponse> {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing order' })
  @ApiOkResponse({
    description: 'Order successfully updated',
    type: ResponseOrderPosDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ResponseOrderNegDto,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Order ID',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @User() user: {sub: string, role: string}
  ): Promise<IResponse> {
    return this.orderService.update(id, updateOrderDto, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order' })
  @ApiOkResponse({
    description: 'Order successfully deleted',
    type: ResponseOrderPosDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ResponseOrderNegDto,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Order ID',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<IResponse> {
    return this.orderService.remove(id);
  }
}
