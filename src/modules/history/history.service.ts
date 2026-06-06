import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseDto } from 'src/common/types';
import { Status } from '@prisma/client';
import { MSG } from 'src/common/i18n/messages';

const COMPLETED_STATUSES: Record<string, Status[]> = {
  ZAMIR:       [Status.ZAVOD, Status.USTANOVCHIK, Status.DONE, Status.CANCEL],
  ZAVOD:       [Status.USTANOVCHIK, Status.DONE, Status.CANCEL],
  USTANOVCHIK: [Status.DONE, Status.CANCEL],
  MANAGER:     [Status.DONE, Status.CANCEL],
  ADMIN:       [Status.DONE, Status.CANCEL],
};

const WORKER_FIELD: Record<string, string> = {
  ZAMIR:       'zamirId',
  ZAVOD:       'zavodId',
  USTANOVCHIK: 'ustId',
  MANAGER:     'managerId',
};

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    userRole: string,
    page:        number  = 1,
    limit:       number  = 10,
    search?:     string,
    regionId?:   string,
    socialId?:   string,
    startDate?:  string,
    endDate?:    string,
  ) {
    const skip = (page - 1) * limit;

    const completedStatuses = COMPLETED_STATUSES[userRole] ?? [Status.DONE];
    const workerField       = WORKER_FIELD[userRole];

    const where: any = {
      status: { in: completedStatuses },
      // ADMIN barcha orderlarni ko'radi, boshqalar faqat o'zinikini
      ...(workerField && userRole !== 'ADMIN' && { [workerField]: userId }),
    };

    if (search?.trim()) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (regionId) where.regionId = regionId;
    if (socialId) where.socialId = socialId;

    if (startDate || endDate) {
      where.updatedAt = {};
      if (startDate) where.updatedAt.gte = new Date(startDate);
      if (endDate)   where.updatedAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          region:          true,
          social:          true,
          orderStatus:     true,
          roomMeasurement: true,
          financeTransactions: {
            select: {
              id: true, type: true, method: true, amount: true, createdAt: true,
              createdBy: { select: { id: true, name: true, role: true } },
              comment: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return new ResponseDto(
      true,
      'Successfully found!',
      orders,
      { total, page, limit, totalPages: Math.ceil(total / limit) },
    );
  }

  async findOne(orderId: string, userId: string, userRole: string) {
    const completedStatuses = COMPLETED_STATUSES[userRole] ?? [Status.DONE];
    const workerField       = WORKER_FIELD[userRole];

    const order = await this.prisma.order.findFirst({
      where: {
        id:     orderId,
        status: { in: completedStatuses },
        ...(workerField && userRole !== 'ADMIN' && { [workerField]: userId }),
      },
      include: {
        region:          true,
        social:          true,
        orderStatus:     true,
        roomMeasurement: true,
        financeTransactions: {
          select: {
            id: true, type: true, method: true, amount: true, createdAt: true,
            createdBy: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(MSG.ORDER_NOT_FOUND);
    }

    return new ResponseDto(true, 'Successfully found!', order);
  }
}
