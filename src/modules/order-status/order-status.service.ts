import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderStatusDto } from './dto/create-order-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';
import { deletedOrderSendBot } from 'src/common/utils/send-telegram.bot';

@Injectable()
export class OrderStatusService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createOrderStatusDto: CreateOrderStatusDto): Promise<IResponse> {
    const isExist = await this.prisma.orderStatus.findUnique({
      where: { name: createOrderStatusDto.name },
    });

    if (isExist) {
      throw new BadRequestException(
        new ResponseDto(false, 'Status already exists'),
      );
    }

    const status = await this.prisma.orderStatus.create({
      data: {
        name: createOrderStatusDto.name,
        color: createOrderStatusDto.color,
      },
    });
    return new ResponseDto(true, 'Status created successfully', status);
  }

  async findAll(): Promise<IResponse> {
    const allStatuses = await this.prisma.orderStatus.findMany();
    return new ResponseDto(
      true,
      'Successfully retrieved all statuses',
      allStatuses,
    );
  }

  async findOne(id: string): Promise<IResponse> {
    const findStatus = await this.prisma.orderStatus.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!findStatus) {
      throw new BadRequestException(
        new ResponseDto(false, 'Status not found!!!'),
      );
    }

    return new ResponseDto(true, 'Status successfully found!', findStatus);
  }

  async update(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<IResponse> {
    const status = await this.prisma.orderStatus.count({ where: { id } });

    if (status === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'Status not found!!!'),
      );
    }

    await this.prisma.orderStatus.update({
      where: { id },
      data: { name: updateOrderStatusDto.name },
    });

    return new ResponseDto(true, 'Successfully updated status!!!');
  }

  async remove(id: string): Promise<IResponse> {
    const status = await this.prisma.orderStatus.count({ where: { id } });

    if (status === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'Status not found!!!'),
      );
    }

    const relatedOrders = await this.prisma.order.findMany({
      where: { orderStatusId: id },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    for (let i = 0; i < relatedOrders.length; i++) {
      await this.prisma.order.update({
        where: { id: relatedOrders[i].id },
        data: {
          orderStatusId: null,
        },
      });
    }
    const data = {
      name: '',
      phone: '',
      item: '',
      itemName: '',
      itemPhone: '',
    };

    await this.prisma.orderStatus.delete({ where: { id } });
    // deletedOrderSendBot()
    return new ResponseDto(true, 'Successfully deleted status!!!');
  }
}
