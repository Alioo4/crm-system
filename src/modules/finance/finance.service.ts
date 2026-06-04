import { ForbiddenException, Injectable } from '@nestjs/common';
import { FinanceTransactionMethod, FinanceTransactionType } from '@prisma/client';
import { ResponseDto } from 'src/common/types';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceDateRangeDto } from './dto/finance-date-range.dto';
import { PaymentsQueryDto } from './dto/payments-query.dto';

const PAYMENT_TYPES = [
  FinanceTransactionType.PREPAYMENT,
  FinanceTransactionType.PAYMENT,
  FinanceTransactionType.REFUND,
];

type TxForSales = { type: FinanceTransactionType; amount: number };
type TxForPayments = TxForSales & { method: FinanceTransactionMethod | null };

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 1. Summary ──────────────────────────────────────────────────────────────

  async getSummary(role: string, query: FinanceDateRangeDto) {
    this.checkAdmin(role);

    const dateFilter = this.buildDateFilter(query.from, query.to);

    const transactions = await this.prisma.financeTransaction.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      select: { type: true, method: true, amount: true, orderId: true },
    });

    const ordersCount = new Set(transactions.map((t) => t.orderId)).size;
    const sales = this.calcSales(transactions);
    const payments = this.calcPayments(transactions);

    return new ResponseDto(true, 'Successfully found!', {
      dateRange: { from: query.from ?? null, to: query.to ?? null },
      summary: {
        ordersCount,
        sales,
        payments,
        debt: { totalDebt: sales.netSale - payments.totalReceived },
      },
    });
  }

  // ─── 2. Payments Detail ───────────────────────────────────────────────────────

  async getPayments(role: string, query: PaymentsQueryDto) {
    this.checkAdmin(role);

    const dateFilter = this.buildDateFilter(query.from, query.to);

    const transactions = await this.prisma.financeTransaction.findMany({
      where: {
        ...(dateFilter && { createdAt: dateFilter }),
        type: { in: PAYMENT_TYPES },
        ...(query.userId && { createdById: query.userId }),
      },
      select: {
        id: true,
        type: true,
        method: true,
        amount: true,
        createdAt: true,
        orderId: true,
        createdBy: { select: { id: true, name: true, role: true } },
        order: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const items = this.groupPaymentsByOrder(transactions);
    const summary = this.calcPaymentsSummary(items);

    return new ResponseDto(true, 'Successfully found!', {
      dateRange: { from: query.from ?? null, to: query.to ?? null },
      ...(query.userId && { filter: { userId: query.userId } }),
      summary,
      items,
    });
  }

  // ─── 3. Debt Orders ───────────────────────────────────────────────────────────

  async getDebtOrders(role: string, query: FinanceDateRangeDto) {
    this.checkAdmin(role);

    const dateFilter = this.buildDateFilter(query.from, query.to);

    const orders = await this.prisma.order.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        managerId: true, managerName: true,
        zamirId: true,   zamirName: true,
        zavodId: true,   zavodName: true,
        ustId: true,     ustName: true,
        financeTransactions: {
          select: { type: true, amount: true, createdById: true },
        },
      },
    });

    const debtItems: ReturnType<typeof this.buildDebtItem>[] = [];
    let totalOrderAmount = 0;
    let totalPaidAmount = 0;

    for (const order of orders) {
      const item = this.buildDebtItem(order);
      if (item.debtAmount <= 0) continue;

      totalOrderAmount += item.orderAmount;
      totalPaidAmount += item.paidAmount;
      debtItems.push(item);
    }

    return new ResponseDto(true, 'Successfully found!', {
      dateRange: { from: query.from ?? null, to: query.to ?? null },
      summary: {
        ordersCount: debtItems.length,
        totalOrderAmount,
        totalPaidAmount,
        totalDebt: totalOrderAmount - totalPaidAmount,
      },
      items: debtItems,
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private checkAdmin(role: string) {
    if (role !== 'ADMIN') throw new ForbiddenException('Permission denied');
  }

  private calcSales(txs: TxForSales[]) {
    let sale = 0, saleAddition = 0, saleCancel = 0;

    for (const tx of txs) {
      if (tx.type === FinanceTransactionType.SALE)          sale         += tx.amount;
      else if (tx.type === FinanceTransactionType.SALE_ADDITION) saleAddition += tx.amount;
      else if (tx.type === FinanceTransactionType.SALE_CANCEL)   saleCancel   += tx.amount;
    }

    return { sale, saleAddition, saleCancel, netSale: sale + saleAddition - saleCancel };
  }

  private calcPayments(txs: TxForPayments[]) {
    let cash = 0, card = 0, refundCash = 0, refundCard = 0;

    for (const tx of txs) {
      const isCash = tx.method === FinanceTransactionMethod.CASH;
      const isCard = tx.method === FinanceTransactionMethod.CARD;

      if (tx.type === FinanceTransactionType.PREPAYMENT || tx.type === FinanceTransactionType.PAYMENT) {
        if (isCash) cash += tx.amount;
        else if (isCard) card += tx.amount;
      } else if (tx.type === FinanceTransactionType.REFUND) {
        if (isCash) refundCash += tx.amount;
        else if (isCard) refundCard += tx.amount;
      }
    }

    return {
      cash,
      card,
      refundCash,
      refundCard,
      totalReceived: cash + card - refundCash - refundCard,
    };
  }

  private groupPaymentsByOrder(
    transactions: {
      id: string;
      type: FinanceTransactionType;
      method: FinanceTransactionMethod | null;
      amount: number;
      createdAt: Date;
      orderId: string;
      createdBy: { id: string; name: string | null; role: string } | null;
      order: { id: string; name: string | null; phone: string | null };
    }[],
  ) {
    type OrderItem = {
      orderId: string;
      client: { id: string; name: string | null; phone: string | null };
      cash: number; card: number; refundCash: number; refundCard: number;
      transactions: object[];
    };

    const orderMap = new Map<string, OrderItem>();

    for (const tx of transactions) {
      if (!orderMap.has(tx.orderId)) {
        orderMap.set(tx.orderId, {
          orderId: tx.orderId,
          client: { id: tx.order.id, name: tx.order.name, phone: tx.order.phone },
          cash: 0, card: 0, refundCash: 0, refundCard: 0,
          transactions: [],
        });
      }

      const item = orderMap.get(tx.orderId)!;
      const isCash = tx.method === FinanceTransactionMethod.CASH;
      const isCard = tx.method === FinanceTransactionMethod.CARD;

      if (tx.type === FinanceTransactionType.REFUND) {
        if (isCash) item.refundCash += tx.amount;
        else if (isCard) item.refundCard += tx.amount;
      } else {
        if (isCash) item.cash += tx.amount;
        else if (isCard) item.card += tx.amount;
      }

      item.transactions.push({
        transactionId: tx.id,
        type: tx.type,
        amount: tx.amount,
        paymentMethodType: tx.method,
        createdAt: tx.createdAt,
        createdBy: tx.createdBy ?? null,
      });
    }

    return Array.from(orderMap.values()).map((item) => ({
      orderId: item.orderId,
      client: item.client,
      receivedAmount: item.cash + item.card - item.refundCash - item.refundCard,
      cash: item.cash,
      card: item.card,
      refundCash: item.refundCash,
      refundCard: item.refundCard,
      transactions: item.transactions,
    }));
  }

  private calcPaymentsSummary(
    items: { cash: number; card: number; refundCash: number; refundCard: number }[],
  ) {
    const cash      = items.reduce((s, i) => s + i.cash,      0);
    const card      = items.reduce((s, i) => s + i.card,      0);
    const refundCash = items.reduce((s, i) => s + i.refundCash, 0);
    const refundCard = items.reduce((s, i) => s + i.refundCard, 0);

    return {
      ordersCount: items.length,
      cash,
      card,
      refundCash,
      refundCard,
      totalReceived: cash + card - refundCash - refundCard,
    };
  }

  private buildDebtItem(order: {
    id: string; name: string | null; phone: string | null;
    status: string; createdAt: Date;
    managerId: string | null; managerName: string | null;
    zamirId: string | null;   zamirName: string | null;
    zavodId: string | null;   zavodName: string | null;
    ustId: string | null;     ustName: string | null;
    financeTransactions: { type: FinanceTransactionType; amount: number; createdById: string | null }[];
  }) {
    const txs = order.financeTransactions;

    const orderAmount = txs.reduce((sum, tx) => {
      if (tx.type === FinanceTransactionType.SALE)           return sum + tx.amount;
      if (tx.type === FinanceTransactionType.SALE_ADDITION)  return sum + tx.amount;
      if (tx.type === FinanceTransactionType.SALE_CANCEL)    return sum - tx.amount;
      return sum;
    }, 0);

    const paidAmount = txs.reduce((sum, tx) => {
      if (tx.type === FinanceTransactionType.PREPAYMENT) return sum + tx.amount;
      if (tx.type === FinanceTransactionType.PAYMENT)    return sum + tx.amount;
      if (tx.type === FinanceTransactionType.REFUND)     return sum - tx.amount;
      return sum;
    }, 0);

    const workerAmountMap = this.buildWorkerAmountMap(txs);

    const workers = [
      { id: order.managerId, name: order.managerName, role: 'MANAGER' },
      { id: order.zamirId,   name: order.zamirName,   role: 'ZAMIR'   },
      { id: order.zavodId,   name: order.zavodName,   role: 'ZAVOD'   },
      { id: order.ustId,     name: order.ustName,     role: 'USTANOVCHIK' },
    ]
      .filter((w) => w.id !== null)
      .map((w) => ({ ...w, amount: workerAmountMap.get(w.id!) ?? 0 }));

    return {
      orderId: order.id,
      client: { id: order.id, name: order.name, phone: order.phone },
      orderAmount,
      paidAmount,
      debtAmount: orderAmount - paidAmount,
      status: order.status,
      createdAt: order.createdAt,
      workers,
    };
  }

  private buildWorkerAmountMap(
    txs: { type: FinanceTransactionType; amount: number; createdById: string | null }[],
  ): Map<string, number> {
    const map = new Map<string, number>();

    for (const tx of txs) {
      if (!tx.createdById) continue;

      const current = map.get(tx.createdById) ?? 0;

      if (tx.type === FinanceTransactionType.PREPAYMENT || tx.type === FinanceTransactionType.PAYMENT) {
        map.set(tx.createdById, current + tx.amount);
      } else if (tx.type === FinanceTransactionType.REFUND) {
        map.set(tx.createdById, current - tx.amount);
      }
    }

    return map;
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
    if (to)   range.lte = toUtc(to, true);
    return range;
  }
}
