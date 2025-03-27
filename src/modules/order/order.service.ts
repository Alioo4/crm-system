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

    const [region, social, orderStatus] = await this.prisma.$transaction(
      [
        this.prisma.region.findUnique({ where: { id: regionId } }),
        this.prisma.social.findUnique({ where: { id: socialId } }),
        this.prisma.orderStatus.findUnique({ where: { id: orderStatusId } }),
      ],
    );

    if (!region)
      throw new NotFoundException(new ResponseDto(false, 'Region not found'));
    if (!social)
      throw new NotFoundException(new ResponseDto(false, 'Social not found'));
    if (!orderStatus)
      throw new NotFoundException(
        new ResponseDto(false, 'Order status not found'),
      );

    const order = await this.prisma.order.create({
      data: {
        regionId,
        socialId,
        orderStatusId,
        ...rest,
      },
    })

    return new ResponseDto(true, 'Order created successfully', order);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    region?: string;
    social?: string;
    orderStatus?: string;
    name?: string;
    phone?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    endDateJob?: string;
    workerArrivalDate?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      region,
      social,
      orderStatus,
      name,
      phone,
      status,
      startDate,
      endDate,
      endDateJob,
      workerArrivalDate,
    } = filters;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {};

    if (region) {
      where.region = {
        name: { contains: region, mode: 'insensitive' },
      };
    }

    if (social) {
      where.social = {
        name: { contains: social, mode: 'insensitive' },
      };
    }

    if (orderStatus) {
      where.orderStatus = {
        name: { contains: orderStatus, mode: 'insensitive' },
      };
    }

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (phone) {
      where.phone = { contains: phone };
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

    return new ResponseDto(true, 'Successfully find!!!', orders, pagination);
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

    const findOrder = await this.prisma.order.findUnique({ where: { id } },);

    if (!findOrder) {
      throw new BadRequestException(new ResponseDto(false, 'Order not found'));
    }

    const isAdminOrManager = role === 'ADMIN' || role === 'MANAGER';

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
    }

    if (status === Status.ZAVOD || status === Status.USTANOVCHIK || status === Status.DONE){
      await this.history.create(history);
    }

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
