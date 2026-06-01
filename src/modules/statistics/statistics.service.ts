import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentType, StatisticsQueryDto } from './dto/filter-query.dto';
import { ResponseDto } from 'src/common/types';
import {
  FinanceTransactionMethod,
  FinanceTransactionType,
} from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role: string, query: StatisticsQueryDto) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Permission denied');
    }

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    // Base filter: date range on createdAt + optional method filter
    const txBaseWhere: any = {};

    const dateRange = this.buildDateFilter(query.startDate, query.endDate);
    if (dateRange) {
      txBaseWhere.createdAt = dateRange;
    }

    if (query.paymentType === PaymentType.CARD) {
      txBaseWhere.method = FinanceTransactionMethod.CARD;
    } else if (query.paymentType === PaymentType.CASH) {
      txBaseWhere.method = FinanceTransactionMethod.CASH;
    }

    const txWhere: any = { ...txBaseWhere };
    if (query.userId) {
      txWhere.order = {
        OR: [
          { managerId: query.userId },
          { zamirId: query.userId },
          { zavodId: query.userId },
          { ustId: query.userId },
        ],
      };
    }

    const orderWhere: any = { financeTransactions: { some: txBaseWhere } };
    if (query.userId) {
      orderWhere.OR = [
        { managerId: query.userId },
        { zamirId: query.userId },
        { zavodId: query.userId },
        { ustId: query.userId },
      ];
    }

    const [txGrouped, orders, totalOrders] = await Promise.all([
      this.prisma.financeTransaction.groupBy({
        by: ['type'],
        where: txWhere,
        _sum: { amount: true },
      }),
      this.prisma.order.findMany({
        where: orderWhere,
        include: {
          region: true,
          social: true,
          orderStatus: true,
          roomMeasurement: true,
          currencyOrder: true,
          financeTransactions: {
            select: {
              id: true,
              createdAt: true,
              type: true,
              method: true,
              amount: true,
              comment: true,
              createdBy: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: orderWhere }),
    ]);

    const sumByType = new Map(
      txGrouped.map((g) => [g.type, g._sum.amount ?? 0]),
    );

    const get = (type: FinanceTransactionType) => sumByType.get(type) ?? 0;

    const currentTotal =
      get(FinanceTransactionType.SALE) +
      get(FinanceTransactionType.SALE_ADDITION) -
      get(FinanceTransactionType.SALE_CANCEL);

    const paidAmount =
      get(FinanceTransactionType.PREPAYMENT) +
      get(FinanceTransactionType.PAYMENT) -
      get(FinanceTransactionType.REFUND);

    const debtAmount = currentTotal - paidAmount;

    return new ResponseDto(
      true,
      'Successfully found!',
      {
        currentTotal,
        paidAmount,
        debtAmount,
        breakdown: {
          sale: get(FinanceTransactionType.SALE),
          saleAddition: get(FinanceTransactionType.SALE_ADDITION),
          saleCancel: get(FinanceTransactionType.SALE_CANCEL),
          prepayment: get(FinanceTransactionType.PREPAYMENT),
          payment: get(FinanceTransactionType.PAYMENT),
          refund: get(FinanceTransactionType.REFUND),
        },
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

  private buildDateFilter(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return null;

    const toUtc = (dateStr: string, endOfDay = false) => {
      const d = new Date(dateStr);
      d.setUTCHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
      return d;
    };

    const range: any = {};
    if (startDate) range.gte = toUtc(startDate);
    if (endDate) range.lte = toUtc(endDate, true);
    return range;
  }
}
