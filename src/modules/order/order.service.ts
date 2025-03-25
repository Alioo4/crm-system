import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';

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

    const status = await this.prisma.status.findUnique({
      where: { name: role },
      select: { id: true },
    });

    const orders = await this.prisma.order.findMany({
      where: { statusId: status?.id },
      select: { orderStatus: false, id: true, status: true }
    });
    return new ResponseDto(true, 'All orders', orders);
  }

  async findOne(id: string): Promise<IResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(new ResponseDto(false, 'Order not found'));
    }

    return new ResponseDto(true, 'Order found', order);
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    role: string,
  ): Promise<IResponse> {
    const { comment, endDateJob, statusId } = updateOrderDto;

    const findOrder = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!findOrder) {
      throw new NotFoundException(new ResponseDto(false, 'Order not found'));
    }

    if (role === 'ADMIN' || role === 'MANAGER') {
      const order = await this.prisma.order.update({
        where: { id },
        data: updateOrderDto,
      });

      return new ResponseDto(true, 'Order updated successfully', order);
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: { comment, endDateJob, statusId },
    });

    return new ResponseDto(true, 'Order updated successfully', order);
  }

  async remove(id: string): Promise<IResponse> {
    const findOrder = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!findOrder) {
      throw new NotFoundException(new ResponseDto(false, 'Order not found'));
    }

    await this.prisma.order.delete({
      where: { id },
    });

    return new ResponseDto(true, 'Order deleted successfully');
  }
}
