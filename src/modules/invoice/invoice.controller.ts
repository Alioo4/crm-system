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
import { InvoiceService } from './invoice.service';
import { UpsertInvoiceDto } from './dto/upsert-invoice.dto';

@ApiBearerAuth()
@ApiTags('Invoice')
@ApiParam({ name: 'orderId', type: 'string', format: 'uuid', description: 'Buyurtma ID si' })
@Controller('orders/:orderId/invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  @ApiOperation({ summary: 'Buyurtmaning invoice sini olish' })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  @ApiResponse({ status: 404, description: "Invoice mavjud emas (invoice yo'qligini bildiradi)" })
  findOne(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
  ): Promise<IResponse> {
    return this.invoiceService.findOne(orderId);
  }

  @Post()
  @ApiOperation({ summary: 'Invoice yaratish' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  @ApiResponse({ status: 409, description: 'Invoice allaqachon mavjud' })
  @ApiResponse({ status: 422, description: 'Business logic xatoligi' })
  create(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Body() dto: UpsertInvoiceDto,
  ): Promise<IResponse> {
    return this.invoiceService.create(orderId, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Invoice ni yangilash' })
  @ApiResponse({ status: 200, description: 'Invoice updated' })
  @ApiResponse({ status: 404, description: 'Invoice mavjud emas' })
  @ApiResponse({ status: 422, description: 'Business logic xatoligi' })
  update(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Body() dto: UpsertInvoiceDto,
  ): Promise<IResponse> {
    return this.invoiceService.update(orderId, dto);
  }

  @Delete()
  @ApiOperation({ summary: "Invoice ni o'chirish" })
  @ApiResponse({ status: 200, description: 'Invoice deleted' })
  @ApiResponse({ status: 404, description: 'Invoice mavjud emas' })
  remove(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
  ): Promise<IResponse> {
    return this.invoiceService.remove(orderId);
  }
}
