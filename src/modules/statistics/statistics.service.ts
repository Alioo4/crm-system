import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatisticsQueryDto } from './dto/filter-query.dto';
import { ResponseDto } from 'src/common/types';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role: string, query: StatisticsQueryDto) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Permission denied');
    }

    const where: any = {
      status: query.status ?? 'DONE',
    };

    const search = query.search?.trim();

    if (search) {
      where.OR = [
        { managerName: { contains: search, mode: 'insensitive' } },
        { managerphone: { contains: search, mode: 'insensitive' } },
        { zamirName: { contains: search, mode: 'insensitive' } },
        { zamirPhone: { contains: search, mode: 'insensitive' } },
        { zavodName: { contains: search, mode: 'insensitive' } },
        { zavodPhone: { contains: search, mode: 'insensitive' } },
        { ustName: { contains: search, mode: 'insensitive' } },
        { ustPhone: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      const start = query.startDate ? new Date(query.startDate) : undefined;
      const end = query.endDate ? new Date(query.endDate) : undefined;

      if (start && end && start.toDateString() === end.toDateString()) {
        const startOfDay = new Date(start);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(start);
        endOfDay.setHours(23, 59, 59, 999);

        where.updatedAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else {
        where.updatedAt = {};
        if (start) where.updatedAt.gte = start;
        if (end) where.updatedAt.lte = end;
      }
    }

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const [orders, totalOrders, totalAmount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          region: true,
          social: true,
          orderStatus: true,
          roomMeasurement: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: {
          total: true,
          prePayment: true,
          dueAmount: true,
        },
      }),
    ]);

    return new ResponseDto(
      true,
      'Successfully found!',
      {
        totalSum: totalAmount._sum.total || 0,
        totalPrePayment: totalAmount._sum.prePayment || 0,
        totalDueAmount: totalAmount._sum.dueAmount || 0,
        totalOrders,
        orders,
      },
      {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
    );
  }
}
