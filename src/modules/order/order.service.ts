import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';
import { HistoryService } from '../history/history.service';
import { Status } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly history: HistoryService,
  ) {}
  async create(createOrderDto: CreateOrderDto): Promise<IResponse> {
    const { regionId, socialId, orderStatusId, ...rest } = createOrderDto;

    const region = regionId
      ? await this.prisma.region.findUnique({ where: { id: regionId } })
      : null;
    if (regionId && !region)
      throw new NotFoundException(new ResponseDto(false, 'Region not found'));

    const social = socialId
      ? await this.prisma.social.findUnique({ where: { id: socialId } })
      : null;
    if (socialId && !social)
      throw new NotFoundException(new ResponseDto(false, 'Social not found'));

    const orderStatus = orderStatusId
      ? await this.prisma.orderStatus.findUnique({
          where: { id: orderStatusId },
        })
      : null;
    if (orderStatusId && !orderStatus)
      throw new NotFoundException(
        new ResponseDto(false, 'Order status not found'),
      );

    const order = await this.prisma.order.create({
      data: {
        regionId: region?.id || null,
        socialId: social?.id || null,
        orderStatusId: orderStatus?.id || null,
        ...rest,
      },
    });

    return new ResponseDto(true, 'Order created successfully', order);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    region?: string;
    social?: string;
    orderStatus?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    endDateJob?: string;
    workerArrivalDate?: string;
    search?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      orderStatus,
      status,
      startDate,
      endDate,
      endDateJob,
      workerArrivalDate,
      search,
    } = filters;

    const skip = Number(page - 1) * Number(limit) || 0;
    const take = Number(limit) || 10;

    const where: any = {};

    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { region: { name: { contains: search, mode: 'insensitive' } } },
        { social: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (orderStatus) {
      where.orderStatus = {
        name: { contains: orderStatus, mode: 'insensitive' },
      };
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (endDateJob) {
      where.endDateJob = { gte: new Date(endDateJob) };
    }

    if (workerArrivalDate) {
      where.workerArrivalDate = { gte: new Date(workerArrivalDate) };
    }

    const orders = await this.prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        region: true,
        social: true,
        orderStatus: true,
        roomMeasurement: true,
      },
    });

    const total = await this.prisma.order.count({ where });

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return new ResponseDto(true, 'Successfully found!!!', orders, pagination);
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
    const { status } = updateOrderDto;

    const findOrder = await this.prisma.order.findUnique({ where: { id } });

    if (!findOrder) {
      throw new BadRequestException(new ResponseDto(false, 'Order not found'));
    }

    const history: any = {
      name: findOrder.name,
      phone: findOrder.phone,
      comment: findOrder.comment,
      endDateJob: findOrder.comment,
      workerArrivalDate: findOrder.workerArrivalDate,
      orderId: findOrder.id,
      total: findOrder.total,
      prePayment: findOrder.prePayment,
      dueAmount: findOrder.dueAmount,
      regionId: findOrder.regionId,
      longitude: findOrder.longitude,
      latitude: findOrder.latitude,
      socialId: findOrder.socialId,
      status: findOrder.status,
    };

    if (
      status === Status.ZAVOD ||
      status === Status.USTANOVCHIK ||
      status === Status.DONE
    ) {
      await this.history.create(history);
    }

    await this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
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

    const relatedOrders = await this.prisma.roomMeasurement.count({
      where: { orderId: id },
    });

    if (relatedOrders > 0) {
      throw new BadRequestException(
        new ResponseDto(
          false,
          'Cannot delete order status because it is linked to existing orders.',
        ),
      );
    }

    await this.prisma.order.delete({
      where: { id },
    });

    return new ResponseDto(true, 'Order deleted successfully');
  }
}
