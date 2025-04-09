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
import { isUUID } from 'src/common/types/isUuid';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly history: HistoryService,
  ) {}
  async create(createOrderDto: CreateOrderDto): Promise<IResponse> {
    const {
      regionId,
      socialId,
      orderStatusId,
      endDateJob,
      workerArrivalDate,
      status,
      ...rest
    } = createOrderDto;

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

    const safeWorkerArrivalDate =
      typeof workerArrivalDate === 'string'
        ? new Date(workerArrivalDate)
        : undefined;

    const safeEndDateJob =
      typeof endDateJob === 'string' ? new Date(endDateJob) : undefined;

    const order = await this.prisma.order.create({
      data: {
        regionId: region?.id || null,
        socialId: social?.id || null,
        orderStatusId: orderStatus?.id || null,
        status: status?.trim() ? status : undefined,
        workerArrivalDate: safeWorkerArrivalDate || null,
        endDateJob: safeEndDateJob || null,
        ...rest,
      },
    });

    return new ResponseDto(true, 'Order created successfully', order);
  }

  async findAll(filters: {
    userStatus: string;
    page?: number;
    limit?: number;
    orderStatusId?: string;
    socialId?: string;
    regionId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    endDateJob?: string;
    workerArrivalDate?: string;
    search?: string;
  }) {
    const {
      userStatus,
      page = 1,
      limit = 10,
      orderStatusId,
      regionId,
      socialId,
      status,
      startDate,
      endDate,
      endDateJob,
      workerArrivalDate,
      search,
    } = filters;

    const take = Number.isNaN(Number(limit)) ? 10 : Number(limit);
    const skip = Number.isNaN(Number(page)) ? 0 : (Number(page) - 1) * take;

    const where: any = {};

    if (typeof search === 'string' && search.trim().length > 2) {
      console.log('search', search.length);

      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (orderStatusId && isUUID(orderStatusId)) {
      where.orderStatusId = orderStatusId;
    }
    if (regionId && isUUID(regionId)) {
      where.regionId = regionId;
    }
    if (socialId && isUUID(socialId)) {
      where.socialId = socialId;
    }
    if (userStatus === 'ADMIN' || userStatus === 'MANAGER') {
      if (status && status.trim().length > 2) {
        where.status = status;
      }
    } else {
      where.status = userStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && startDate.trim().length > 2) {
        const date = new Date(startDate);
        if (!isNaN(date.getTime())) where.createdAt.gte = date;
      }
      if (endDate && endDate.trim().length > 2) {
        const date = new Date(endDate);
        if (!isNaN(date.getTime())) where.createdAt.lte = date;
      }
    }

    if (endDateJob && endDateJob.trim().length > 2) {
      const date = new Date(endDateJob);
      if (!isNaN(date.getTime())) where.endDateJob = { gte: date };
    }

    if (workerArrivalDate && workerArrivalDate.trim().length > 2) {
      const date = new Date(workerArrivalDate);
      if (!isNaN(date.getTime())) where.workerArrivalDate = { gte: date };
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
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
      }),
      this.prisma.order.count({ where }),
    ]);

    return new ResponseDto(true, 'Successfully found!', orders, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  async findOne(id: string): Promise<IResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        region: true,
        social: true,
        orderStatus: true,
        roomMeasurement: true,
      },
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
      endDateJob: findOrder.endDateJob,
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
      data: {
        ...updateOrderDto,
        orderStatusId:
          status === Status.ZAMIR ? null : updateOrderDto.orderStatusId,
      },
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
