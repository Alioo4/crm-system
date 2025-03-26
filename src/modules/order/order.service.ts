import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';
import { Status } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createOrderDto: CreateOrderDto): Promise<IResponse> {
    const order = await this.prisma.order.create({
      data: createOrderDto,
    });
    return new ResponseDto(true, 'Order created successfully', order);
  }

  async findAll(role: string): Promise<IResponse> {
    if (role === 'ADMIN' || role === 'MANGARE') {
      const orders = await this.prisma.order.findMany();
      return new ResponseDto(true, 'All orders', orders);
    }

    const orders = await this.prisma.order.findMany({
      where: { status: role as Status },
      select: {
        orderStatus: false,
        id: true,
        name: true,
        phone: true,
        comment: true,
        workerArrivalDate: true,
        endDateJob: true,
        status: true,
        region: true,
        social: true,
        roomMeasurement: true,
        latitude: true,
        longitude: true,
        total: true,
        prePayment: true,
        dueAmount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return new ResponseDto(true, 'All orders', orders);
  }

  async findOne(id: string): Promise<IResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new BadRequestException(new ResponseDto(false, 'Order not found'));
    }

    return new ResponseDto(true, 'Order found', order);
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    role: string,
  ): Promise<IResponse> {
    const { comment, endDateJob, status } = updateOrderDto;

    const findOrder = await this.prisma.order.findUnique({ where: { id } });

    if (!findOrder) {
      throw new BadRequestException(new ResponseDto(false, 'Order not found'));
    }

    const isAdminOrManager = role === 'ADMIN' || role === 'MANAGER';

    const updateData = isAdminOrManager
      ? updateOrderDto
      : { comment, endDateJob, status };

    await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    return new ResponseDto(true, 'Order updated successfully');
  }

  async remove(id: string): Promise<IResponse> {
    const findOrder = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!findOrder) {
      throw new BadRequestException(new ResponseDto(false, 'Order not found'));
    }

    await this.prisma.order.delete({
      where: { id },
    });

    return new ResponseDto(true, 'Order deleted successfully');
  }
}
