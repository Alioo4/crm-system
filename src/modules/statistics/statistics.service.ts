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
  
    const where: any = {};
    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);
  
    if (dateFilter) {
      where.OR = [
        { getPrePaymentDate: dateFilter },
        { getAllPaymentDate: dateFilter },
      ];
    }
  
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;
  
    // Income uchun barcha orderlarni olish (pagination siz)
    const [paginatedOrders, totalOrders, totalAmount, allOrdersForIncome] =
      await Promise.all([
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
  
        // Faqat income hisoblash uchun — minimal field lar
        this.prisma.order.findMany({
          where,
          select: {
            getPrePaymentDate: true,
            getAllPaymentDate: true,
            prePayment: true,
            total: true,
          },
        }),
      ]);
  
    // Income to'g'ri hisoblash — BARCHA orderlar bo'yicha
    let income = 0;
  
    for (const order of allOrdersForIncome) {
      const prePaymentDate = order.getPrePaymentDate
        ? new Date(order.getPrePaymentDate)
        : null;
  
      const allPaymentDate = order.getAllPaymentDate
        ? new Date(order.getAllPaymentDate)
        : null;
  
      if (
        prePaymentDate &&
        this.isDateInRange(prePaymentDate, query.startDate, query.endDate)
      ) {
        income += Number(order.prePayment || 0);
      }
  
      if (
        allPaymentDate &&
        this.isDateInRange(allPaymentDate, query.startDate, query.endDate)
      ) {
        income += Number(order.total || 0) - Number(order.prePayment || 0);
      }
    }
  
    return new ResponseDto(
      true,
      'Successfully found!',
      {
        income,
        totalSum: totalAmount._sum.total || 0,
        totalPrePayment: totalAmount._sum.prePayment || 0,
        totalDueAmount: totalAmount._sum.dueAmount || 0,
        totalOrders,
        orders: paginatedOrders,
      },
      {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
    );
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

  private isDateInRange(
    date: Date,
    startDate?: string,
    endDate?: string,
  ): boolean {
    const target = new Date(date);

    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);

      if (target < start) {
        return false;
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);

      if (target > end) {
        return false;
      }
    }

    return true;
  }
}
