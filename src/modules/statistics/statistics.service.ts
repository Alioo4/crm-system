import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentType, StatisticsQueryDto } from './dto/filter-query.dto';
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
      status: {
        in: [Status.ZAVOD, Status.DONE],
      },
    };

    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);

    if (dateFilter) {
      where.OR = [
        { getPrePaymentDate: dateFilter },
        { getAllPaymentDate: dateFilter },
      ];
    }

    if (query.paymentType === PaymentType.CARD) {
      where.currencyOrder = { some: { card: { gt: 0 } } };
    } else if (query.paymentType === PaymentType.CASH) {
      where.currencyOrder = { some: { cash: { gt: 0 } } };
    }

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const [paginatedOrders, totalOrders, totalAmount, allOrdersForIncome] =
      await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            region: true,
            social: true,
            orderStatus: true,
            roomMeasurement: true,
            currencyOrder: true,
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

        this.prisma.order.findMany({
          where,
          select: {
            getPrePaymentDate: true,
            getAllPaymentDate: true,
            prePayment: true,
            total: true,
            currencyOrder: {
              select: { card: true, cash: true, isPrePayment: true },
            },
          },
        }),
      ]);

    let income = 0;
    let cardTotal = 0;
    let cashTotal = 0;
    let totalSum = 0;

    for (const order of allOrdersForIncome) {
      const prePaymentDate = order.getPrePaymentDate
        ? new Date(order.getPrePaymentDate)
        : null;

      const allPaymentDate = order.getAllPaymentDate
        ? new Date(order.getAllPaymentDate)
        : null;

      const prePaymentInRange =
        prePaymentDate &&
        this.isDateInRange(prePaymentDate, query.startDate, query.endDate);

      const allPaymentInRange =
        allPaymentDate &&
        this.isDateInRange(allPaymentDate, query.startDate, query.endDate);

      for (const co of order.currencyOrder) {
        if (co.isPrePayment && prePaymentInRange) {
          cardTotal += Number(co.card || 0);
          cashTotal += Number(co.cash || 0);
        } else if (!co.isPrePayment && allPaymentInRange) {
          cardTotal += Number(co.card || 0);
          cashTotal += Number(co.cash || 0);
        }
      }

      if (prePaymentInRange) {
        income += Number(order.prePayment || 0);
        totalSum += Number(order.total || 0);
      }

      if (allPaymentInRange) {
        income += Number(order.total || 0) - Number(order.prePayment || 0);
      }
    }

    if (query.paymentType === PaymentType.CARD) {
      income = cardTotal;
    } else if (query.paymentType === PaymentType.CASH) {
      income = cashTotal;
    }

    return new ResponseDto(
      true,
      'Successfully found!',
      {
        income,
        cardTotal,
        cashTotal,
        totalSum,
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
      if (target < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      if (target > end) return false;
    }

    return true;
  }
}
