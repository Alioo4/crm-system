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
import { Role, Status } from '@prisma/client';
import { isUUID } from 'src/common/types/isUuid';
import {
  generateTelegramMessage,
  sendTelegramOrderChange,
  sendTelegramOrderDone,
} from 'src/common/utils/send-telegram.bot';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly history: HistoryService,
  ) {}
  async create(
    createOrderDto: CreateOrderDto,
    { sub, role },
  ): Promise<IResponse> {
    const {
      regionId,
      socialId,
      orderStatusId,
      endDateJob,
      workerArrivalDate,
      status,
      ...rest
    } = createOrderDto;

    const findUseer = await this.prisma.user.findUnique({
      where: { id: sub },
      select: {
        name: true,
        phone: true,
      },
    });

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
        managerName: findUseer?.name || null,
        managerphone: findUseer?.phone || null,
        ...rest,
      },
    });

    return new ResponseDto(true, 'Order created successfully', order);
  }

  async findAll(filters: {
    userId: string;
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
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { region: { name: { contains: search, mode: 'insensitive' } } },
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
    } else if(userStatus === 'ZAMIR') {
      where.zamirId = filters.userId;
      where.status = userStatus;
    } else if(userStatus === 'USTANOVCHIK') {
      where.ustId = filters.userId;
      where.status = userStatus;
    } else if(userStatus === 'ZAVOD') {
      where.zavodId = filters.userId;
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
          currencyOrder: true,
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
    { sub, role },
  ): Promise<IResponse> {
    const { status } = updateOrderDto;

    const findOrder = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        comment: true,
        endDateJob: true,
        workerArrivalDate: true,
        total: true,
        prePayment: true,
        dueAmount: true,
        regionId: true,
        longitude: true,
        latitude: true,
        socialId: true,
        status: true,
        managerName: true,
        managerphone: true,
        zamirId: true,
        zamirName: true,
        zamirPhone: true,
        ustId: true,
        ustName: true,
        ustPhone: true,
        zavodId: true,
        zavodName: true,
        zavodPhone: true,
        getAllPaymentDate: true,
        getPrePaymentDate: true,
      },
    });

    if (!findOrder) {
      throw new BadRequestException(new ResponseDto(false, 'Order not found'));
    }

    if (
      role === Role.ADMIN ||
      role === Role.MANAGER ||
      findOrder.zamirId === sub ||
      findOrder.ustId === sub ||
      findOrder.zavodId === sub
    ) {
      const findUseer = await this.prisma.user.findUnique({
        where: { id: sub },
        select: {
          name: true,
          phone: true,
        },
      });

      if (role === 'ZAMIR') {
        await this.prisma.order.update({
          where: { id },
          data: {
            zamirName: findUseer?.name || null,
            zamirPhone: findUseer?.phone || null,
          },
        });
      } else if (role === 'USTANOVCHIK') {
        await this.prisma.order.update({
          where: { id },
          data: {
            ustName: findUseer?.name || null,
            ustPhone: findUseer?.phone || null,
          },
        });
      } else if (role === 'ZAVOD') {
        await this.prisma.order.update({
          where: { id },
          data: {
            zavodName: findUseer?.name || null,
            zavodPhone: findUseer?.phone || null,
          },
        });
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
        getAllPaymentDate: findOrder.getAllPaymentDate,
        getPrePaymentDate: findOrder.getPrePaymentDate,
      };

      if (
        status === Status.ZAVOD ||
        status === Status.USTANOVCHIK ||
        status === Status.DONE
      ) {
        await this.history.create(history);
      }

      const changeOrder = await this.prisma.order.update({
        where: { id },
        data: {
          ...updateOrderDto,
          orderStatusId:
            status === Status.ZAMIR ? null : updateOrderDto.orderStatusId,
        },
        include: {
          region: true,
        },
      });

      const sendTelegram = async (type: 'new' | 'changed' | 'done') => {
        const rooms = await this.prisma.roomMeasurement.findMany({
          where: { orderId: id },
          select: { name: true, key: true, value: true },
        });

        const data = {
          name: changeOrder.name || 'name',
          phone: changeOrder.phone || 'phone',
          comment: changeOrder.comment || '',
          regionName: changeOrder.region?.name || 'default',
          lon: changeOrder.longitude || 0,
          lat: changeOrder.latitude || 0,
          workerArriveDate: changeOrder.workerArrivalDate?.toString() || '',
          endedjobDate: changeOrder.endDateJob?.toString() || '',
          rooms: rooms.map((room) => ({
            name: room.name || '',
            key: room.key || '',
            value: room.value || '',
          })),
        };

        if (type === 'new') generateTelegramMessage(data);
        else if (type === 'changed') sendTelegramOrderChange(data);
        else if (type === 'done') sendTelegramOrderDone(data);
      };

      if (findOrder.status === Status.ZAMIR && status === Status.ZAVOD) {
        await sendTelegram('new');
      } else if (
        !status ||
        (findOrder.status === Status.ZAVOD && status === Status.ZAVOD)
      ) {
        await sendTelegram('changed');
      } else if (status === Status.DONE) {
        const findHistory = await this.prisma.history.findFirst({
          where: { orderId: id },
          select: { id: true },
        });

        if (findHistory) {
          await this.prisma.history.update({
            where: { id: findHistory.id },
            data: {
              managerName: findOrder.managerName,
              managerphone: findOrder.managerphone,
              zamirName: findOrder.zamirName,
              zamirPhone: findOrder.zamirPhone,
              ustName: findOrder.ustName,
              ustPhone: findOrder.ustPhone,
              zavodName: findOrder.zavodName,
              zavodPhone: findOrder.zavodPhone,
              getAllPaymentDate: findOrder.getAllPaymentDate,
              getPrePaymentDate: findOrder.getPrePaymentDate,
            },
          });
        }

        await sendTelegram('done');
      }

      return new ResponseDto(true, 'Order updated successfully');
    } else {
      throw new BadRequestException(
        new ResponseDto(false, 'You do not have permission to update this order'),
      );
    }
  }

  async remove(id: string): Promise<IResponse> {
    const findOrder = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!findOrder) {
      throw new BadRequestException(new ResponseDto(false, 'Order not found'));
    }

    const relatedOrders = await this.prisma.roomMeasurement.findMany({
      where: { orderId: id },
      select: {
        id: true,
      },
    });

    const ids = relatedOrders.map((order) => order.id);
    if (ids.length !== 0) {
      await this.prisma.roomMeasurement.deleteMany({
        where: { id: { in: ids } },
      });
    }

    await this.prisma.order.delete({
      where: { id },
    });

    return new ResponseDto(true, 'Order deleted successfully');
  }

  async getOrderByOrderId(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        zamirId: true,
        ustId: true,
        zavodId: true,
        managerId: true,
      },
    });

    if (!order) {
      throw new NotFoundException(new ResponseDto(false, 'Order not found'));
    }

    if (role === Status.ZAMIR && !order.zamirId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          zamirId: userId,
        },
      });
    } else if (role === Status.USTANOVCHIK && !order.ustId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          ustId: userId,
        },
      });
    } else if (role === Status.ZAVOD && !order.zavodId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          zavodId: userId,
        },
      });
    } else if (order.zavodId || order.ustId || order.zamirId) {
      throw new BadRequestException(
        new ResponseDto(
          false,
          'This order is already assigned to another user',
        ),
      );
    } else {
      throw new BadRequestException(
        new ResponseDto(
          false,
          'You do not have permission to assign this order',
        ),
      );
    }
  }
}
