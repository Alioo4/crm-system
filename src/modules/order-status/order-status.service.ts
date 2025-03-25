import { Injectable } from '@nestjs/common';
import { CreateOrderStatusDto } from './dto/create-order-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';

@Injectable()
export class OrderStatusService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createOrderStatusDto: CreateOrderStatusDto): Promise<IResponse> {
    const [isExist, statusColor] = await this.prisma.$transaction([
      this.prisma.orderStatus.findUnique({
        where: { name: createOrderStatusDto.name },
      }),
      this.prisma.orderStatus.findFirst({
        orderBy: { color: 'desc' },
        select: { color: true },
      }),
    ]);

    if (isExist) {
      return new ResponseDto(false, 'Status already exists', null);
    }

    const colorInt = statusColor ? Number(statusColor.color) + 1 : 1;

    const status = await this.prisma.orderStatus.create({
      data: { name: createOrderStatusDto.name, color: colorInt },
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
      return new ResponseDto(false, 'Status not found!!!', null);
    }

    return new ResponseDto(true, 'Status sucessfully found!', findStatus);
  }

  async update(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<IResponse> {
    const status = await this.prisma.orderStatus.count({ where: { id } });

    if (status === 0) {
      return new ResponseDto(false, 'Status not found!!!', null);
    }

    const updateData = await this.prisma.orderStatus.update({
      where: { id },
      data: { name: updateOrderStatusDto.name },
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new ResponseDto(true, 'Sucessfully updated status!', updateData);
  }

  async remove(id: string): Promise<IResponse> {
    const status = await this.prisma.orderStatus.count({ where: { id } });

    if (status === 0) {
      return new ResponseDto(false, 'Status not found!!!', null);
    }

    await this.prisma.orderStatus.delete({ where: { id } });
    return new ResponseDto(true, 'Sucessfully deleted status!', null);
  }
}
