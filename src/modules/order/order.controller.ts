import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { User } from 'src/common/decorators/get-user.decarator';
import { Public } from 'src/common/decorators/public.decorator';
import { GetOrderFilterDto } from './dto/query.dto';

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
  create(
    @Body() createOrderDto: CreateOrderDto,
    @User() user: {sub: string, role: string}
  ): Promise<IResponse> {
    return this.orderService.create(createOrderDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'orderStatusId', required: false, type: String, description: 'Search by order status' })
  @ApiQuery({ name: 'socialId', required: false, type: String, description: 'Search by socialId' })
  @ApiQuery({ name: 'regionId', required: false, type: String, description: 'Search by regionId' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, phone, regionName and socialName' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Search by status' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by start date (createdAt)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by end date (createdAt)' })
  @ApiQuery({ name: 'endDateJob', required: false, type: String, description: 'Filter by end date of job' })
  @ApiQuery({ name: 'workerArrivalDate', required: false, type: String, description: 'Filter by worker arrival date' })
  findAll(
    @User() user: {sub: string, role: string},
    @Query() query: GetOrderFilterDto,
  ) {
    return this.orderService.findAll({
      userStatus: user.role,
      ...query,
    });
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
    return this.orderService.update(id, updateOrderDto, user);
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
