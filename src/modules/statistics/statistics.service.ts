import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatisticsQueryDto } from './dto/filter-query.dto';
import { ResponseDto } from 'src/common/types';
import { FinanceTransactionType, FinanceTransactionMethod } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role: string, query: StatisticsQueryDto) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Permission denied');
    }

    const dateFilter = this.buildDateFilter(query.from, query.to);

    const transactions = await this.prisma.financeTransaction.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      select: {
        type: true,
        method: true,
        amount: true,
        orderId: true,
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    let sumSale = 0, sumSaleAddition = 0, sumSaleCancel = 0;
    let sumCash = 0, sumCard = 0, sumRefundCash = 0, sumRefundCard = 0;
    const summaryOrderIds = new Set<string>();

    for (const tx of transactions) {
      summaryOrderIds.add(tx.orderId);
      this.accumulate(tx, {
        onSale: (a) => { sumSale += a; },
        onSaleAddition: (a) => { sumSaleAddition += a; },
        onSaleCancel: (a) => { sumSaleCancel += a; },
        onCash: (a) => { sumCash += a; },
        onCard: (a) => { sumCard += a; },
        onRefundCash: (a) => { sumRefundCash += a; sumCash -= a; },
        onRefundCard: (a) => { sumRefundCard += a; sumCard -= a; },
      });
    }

    const netSale = sumSale + sumSaleAddition - sumSaleCancel;
    const totalReceived = sumCash + sumCard;

    const summary = {
      ordersCount: summaryOrderIds.size,
      sales: { sale: sumSale, saleAddition: sumSaleAddition, saleCancel: sumSaleCancel, netSale },
      payments: { cash: sumCash, card: sumCard, refundCash: sumRefundCash, refundCard: sumRefundCard, totalReceived },
      debt: { totalDebt: netSale - totalReceived },
    };

    type OrderAgg = {
      orderId: string;
      sale: number; saleAddition: number; saleCancel: number;
      cash: number; card: number; refundCash: number; refundCard: number;
    };
    type UserAgg = {
      userId: string; name: string;
      orderIds: Set<string>;
      sale: number; saleAddition: number; saleCancel: number;
      cash: number; card: number; refundCash: number; refundCard: number;
      orders: Map<string, OrderAgg>;
    };

    const roleMap = new Map<string, Map<string, UserAgg>>();

    for (const tx of transactions) {
      if (!tx.createdBy) continue;
      const { id: userId, name, role: userRole } = tx.createdBy;

      if (!roleMap.has(userRole)) roleMap.set(userRole, new Map());
      const userMap = roleMap.get(userRole)!;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          name: name ?? '',
          orderIds: new Set(),
          sale: 0, saleAddition: 0, saleCancel: 0,
          cash: 0, card: 0, refundCash: 0, refundCard: 0,
          orders: new Map(),
        });
      }
      const user = userMap.get(userId)!;
      user.orderIds.add(tx.orderId);

      if (!user.orders.has(tx.orderId)) {
        user.orders.set(tx.orderId, {
          orderId: tx.orderId,
          sale: 0, saleAddition: 0, saleCancel: 0,
          cash: 0, card: 0, refundCash: 0, refundCard: 0,
        });
      }
      const ord = user.orders.get(tx.orderId)!;

      this.accumulate(tx, {
        onSale: (a) => { user.sale += a; ord.sale += a; },
        onSaleAddition: (a) => { user.saleAddition += a; ord.saleAddition += a; },
        onSaleCancel: (a) => { user.saleCancel += a; ord.saleCancel += a; },
        onCash: (a) => { user.cash += a; ord.cash += a; },
        onCard: (a) => { user.card += a; ord.card += a; },
        onRefundCash: (a) => { user.refundCash += a; ord.refundCash += a; user.cash -= a; ord.cash -= a; },
        onRefundCard: (a) => { user.refundCard += a; ord.refundCard += a; user.card -= a; ord.card -= a; },
      });
    }

    const byRole = Array.from(roleMap.entries()).map(([roleName, userMap]) => ({
      role: roleName,
      users: Array.from(userMap.values()).map((u) => {
        const userNetSale = u.sale + u.saleAddition - u.saleCancel;
        const userTotalReceived = u.cash + u.card;
        return {
          userId: u.userId,
          name: u.name,
          ordersCount: u.orderIds.size,
          sales: {
            sale: u.sale, saleAddition: u.saleAddition, saleCancel: u.saleCancel,
            netSale: userNetSale,
          },
          payments: {
            cash: u.cash, card: u.card,
            refundCash: u.refundCash, refundCard: u.refundCard,
            totalReceived: userTotalReceived,
          },
          debt: { totalDebt: userNetSale - userTotalReceived },
          orders: Array.from(u.orders.values()).map((o) => {
            const orderNetSale = o.sale + o.saleAddition - o.saleCancel;
            const orderTotalReceived = o.cash + o.card;
            return {
              orderId: o.orderId,
              cash: o.cash,
              card: o.card,
              totalReceived: orderTotalReceived,
              netSale: orderNetSale,
              debtAmount: orderNetSale - orderTotalReceived,
            };
          }),
        };
      }),
    }));

    return new ResponseDto(true, 'Successfully found!', {
      dateRange: { from: query.from ?? null, to: query.to ?? null },
      summary,
      byRole,
    });
  }

  private accumulate(
    tx: { type: FinanceTransactionType; method: FinanceTransactionMethod | null; amount: number },
    cb: {
      onSale: (a: number) => void;
      onSaleAddition: (a: number) => void;
      onSaleCancel: (a: number) => void;
      onCash: (a: number) => void;
      onCard: (a: number) => void;
      onRefundCash: (a: number) => void;
      onRefundCard: (a: number) => void;
    },
  ) {
    switch (tx.type) {
      case FinanceTransactionType.SALE:         cb.onSale(tx.amount); break;
      case FinanceTransactionType.SALE_ADDITION: cb.onSaleAddition(tx.amount); break;
      case FinanceTransactionType.SALE_CANCEL:   cb.onSaleCancel(tx.amount); break;
      case FinanceTransactionType.PREPAYMENT:
      case FinanceTransactionType.PAYMENT:
        if (tx.method === FinanceTransactionMethod.CASH) cb.onCash(tx.amount);
        else if (tx.method === FinanceTransactionMethod.CARD) cb.onCard(tx.amount);
        break;
      case FinanceTransactionType.REFUND:
        if (tx.method === FinanceTransactionMethod.CASH) cb.onRefundCash(tx.amount);
        else if (tx.method === FinanceTransactionMethod.CARD) cb.onRefundCard(tx.amount);
        break;
    }
  }

  private buildDateFilter(from?: string, to?: string) {
    if (!from && !to) return null;
    const toUtc = (dateStr: string, endOfDay = false) => {
      const d = new Date(dateStr);
      d.setUTCHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
      return d;
    };
    const range: any = {};
    if (from) range.gte = toUtc(from);
    if (to) range.lte = toUtc(to, true);
    return range;
  }
}
