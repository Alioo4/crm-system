import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatisticsQueryDto } from './dto/filter-query.dto';
import { ResponseDto } from 'src/common/types';
import { Status } from '@prisma/client';

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
    if (search) where.OR = this.buildSearchFilters(search);

    const isZamir = query.status === Status.ZAMIR;
    const dateField = isZamir ? 'getPrePaymentDate' : 'getAllPaymentDate';
    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);

    if (dateFilter) {
      where[dateField] = dateFilter;
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

  private buildSearchFilters(search: string) {
    const fields = [
      'managerName',
      'managerphone',
      'zamirName',
      'zamirPhone',
      'zavodName',
      'zavodPhone',
      'ustName',
      'ustPhone',
      'name',
      'phone',
    ];

    return fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' },
    }));
  }

  private buildDateFilter(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (!start && !end) return null;

    if (start && end && start.toDateString() === end.toDateString()) {
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(start);
      endOfDay.setHours(23, 59, 59, 999);

      return {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const range: any = {};
    if (start) range.gte = start;
    if (end) range.lte = end;

    return range;
  }
}
