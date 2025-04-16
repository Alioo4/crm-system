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

    const isZavod = query.status === Status.ZAVOD;
    const dateField = isZavod ? 'getPrePaymentDate' : 'getAllPaymentDate';
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
    if (!startDate && !endDate) return null;
  
    const getUtcDate = (dateStr: string, endOfDay = false) => {
      const date = new Date(dateStr);
      if (endOfDay) {
        date.setUTCHours(23, 59, 59, 999);
      } else {
        date.setUTCHours(0, 0, 0, 0);
      }
      return date;
    };
  
    const start = startDate ? getUtcDate(startDate) : undefined;
    const end = endDate ? getUtcDate(endDate, true) : undefined;
  
    if (start && end && start.toDateString() === end.toDateString()) {
      return { gte: start, lte: end };
    }
  
    const range: any = {};
    if (start) range.gte = start;
    if (end) range.lte = end;
  
    return range;
  } 
}
