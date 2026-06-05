import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { FinanceTransactionMethod, FinanceTransactionType } from '@prisma/client';
import { ResponseDto } from 'src/common/types';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceDateRangeDto } from './dto/finance-date-range.dto';
import { PaymentsQueryDto } from './dto/payments-query.dto';
import { HandoverQueryDto } from './dto/handover-query.dto';
import { ConfirmHandoverDto } from './dto/confirm-handover.dto';
import { MSG } from 'src/common/i18n/messages';

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
      where: {
        ...(dateFilter && { createdAt: dateFilter }),
        ...(query.userId && { createdById: query.userId }),
      },
      select: { type: true, method: true, amount: true, orderId: true },
    });

    const ordersCount = new Set(transactions.map((t) => t.orderId)).size;
    const sales    = this.calcSales(transactions);
    const payments = this.calcPayments(transactions);

    return new ResponseDto(true, 'Successfully found!', {
      dateRange: { from: query.from ?? null, to: query.to ?? null },
      ...(query.userId && { filter: { userId: query.userId } }),
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

    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;
    const skip  = (page - 1) * limit;

    const dateFilter = this.buildDateFilter(query.from, query.to);

    const where = {
      ...(dateFilter && { createdAt: dateFilter }),
      type: { in: PAYMENT_TYPES },
      ...(query.userId && { createdById: query.userId }),
    };

    // ── Summary: barcha transaksiyalardan kichik select ───────────────────────
    const allTxs = await this.prisma.financeTransaction.findMany({
      where,
      select: { orderId: true, type: true, method: true, amount: true },
    });

    const allOrderIds  = [...new Set(allTxs.map((t) => t.orderId))];
    const total        = allOrderIds.length;
    const pagedOrderIds = allOrderIds.slice(skip, skip + limit);

    // ── Items: faqat shu sahifadagi orderlar uchun to'liq ma'lumot ────────────
    const pagedTxs = pagedOrderIds.length > 0
      ? await this.prisma.financeTransaction.findMany({
          where: { ...where, orderId: { in: pagedOrderIds } },
          select: {
            id: true, type: true, method: true, amount: true,
            createdAt: true, orderId: true,
            createdBy: { select: { id: true, name: true, role: true } },
            order:     { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: 'asc' },
        })
      : [];

    const items   = this.groupPaymentsByOrder(pagedTxs);
    // Summary barcha transaksiyalardan hisoblanadi (sahifa emas)
    const allItems = this.calcSummaryFromTxList(allTxs);
    const summary  = allItems;

    return new ResponseDto(
      true,
      'Successfully found!',
      {
        dateRange: { from: query.from ?? null, to: query.to ?? null },
        ...(query.userId && { filter: { userId: query.userId } }),
        summary,
        items,
      },
      { page, limit, total, totalPages: Math.ceil(total / limit) },
    );
  }

  // ─── 3. Debt Orders ───────────────────────────────────────────────────────────

  async getDebtOrders(role: string, query: FinanceDateRangeDto) {
    this.checkAdmin(role);

    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;
    const skip  = (page - 1) * limit;

    const dateFilter = this.buildDateFilter(query.from, query.to);

    const orders = await this.prisma.order.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      select: {
        id: true, name: true, phone: true, status: true, createdAt: true,
        managerId: true, managerName: true,
        zamirId: true,   zamirName: true,
        zavodId: true,   zavodName: true,
        ustId: true,     ustName: true,
        financeTransactions: {
          select: { type: true, amount: true, createdById: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ── Barcha qarzdor orderlar (summary uchun) ───────────────────────────────
    const allDebtItems: ReturnType<typeof this.buildDebtItem>[] = [];
    let totalOrderAmount = 0;
    let totalPaidAmount  = 0;

    for (const order of orders) {
      const item = this.buildDebtItem(order);
      if (item.debtAmount <= 0) continue;
      totalOrderAmount += item.orderAmount;
      totalPaidAmount  += item.paidAmount;
      allDebtItems.push(item);
    }

    const total     = allDebtItems.length;
    const pagedItems = allDebtItems.slice(skip, skip + limit);

    return new ResponseDto(
      true,
      'Successfully found!',
      {
        dateRange: { from: query.from ?? null, to: query.to ?? null },
        summary: {
          ordersCount:      total,
          totalOrderAmount,
          totalPaidAmount,
          totalDebt: totalOrderAmount - totalPaidAmount,
        },
        items: pagedItems,
      },
      { page, limit, total, totalPages: Math.ceil(total / limit) },
    );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private checkAdmin(role: string) {
    if (role !== 'ADMIN') throw new ForbiddenException(MSG.PERMISSION_DENIED);
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
    const cash       = items.reduce((s, i) => s + i.cash,       0);
    const card       = items.reduce((s, i) => s + i.card,       0);
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

  // Barcha transaksiyalar ro'yxatidan to'lov summarysi (pagination uchun)
  private calcSummaryFromTxList(
    txs: { type: FinanceTransactionType; method: FinanceTransactionMethod | null; amount: number; orderId: string }[],
  ) {
    let cash = 0, card = 0, refundCash = 0, refundCard = 0;
    const orderIds = new Set<string>();

    for (const tx of txs) {
      orderIds.add(tx.orderId);
      const isCash = tx.method === FinanceTransactionMethod.CASH;
      const isCard = tx.method === FinanceTransactionMethod.CARD;

      if (tx.type === FinanceTransactionType.REFUND) {
        if (isCash) refundCash += tx.amount;
        if (isCard) refundCard += tx.amount;
      } else {
        if (isCash) cash += tx.amount;
        if (isCard) card += tx.amount;
      }
    }

    return {
      ordersCount: orderIds.size,
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

  // ─── Handover: ishchi yig'gan pulni admin/managerga topshirish ───────────────

  async getHandover(role: string, query: HandoverQueryDto) {
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      throw new ForbiddenException(MSG.PERMISSION_DENIED);
    }

    const dateFilter = this.buildDateFilter(query.from, query.to);

    const txs = await this.prisma.financeTransaction.findMany({
      where: {
        type:       { in: [FinanceTransactionType.PREPAYMENT, FinanceTransactionType.PAYMENT] },
        ...(dateFilter && { createdAt: dateFilter }),
        ...(query.userId && { createdById: query.userId }),
        ...(query.pending === true  && { handedOver: false }),
        ...(query.pending === false && { handedOver: true  }),
      },
      select: {
        id:              true,
        type:            true,
        method:          true,
        amount:          true,
        comment:         true,
        createdAt:       true,
        handedOver:      true,
        handedOverAt:    true,
        handedOverByName: true,
        orderId:         true,
        order:           { select: { id: true, name: true, phone: true } },
        createdBy:       { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // ── Ishchilar bo'yicha guruhlash ──────────────────────────────────────────
    type WorkerEntry = {
      userId:   string;
      name:     string | null;
      role:     string | null;
      pending:  { cash: number; card: number; total: number; items: object[] };
      done:     { cash: number; card: number; total: number; items: object[] };
    };

    const workerMap = new Map<string, WorkerEntry>();

    for (const tx of txs) {
      const uid  = tx.createdBy?.id ?? 'unknown';
      const name = tx.createdBy?.name ?? null;
      const role = tx.createdBy?.role ?? null;

      if (!workerMap.has(uid)) {
        workerMap.set(uid, {
          userId: uid, name, role,
          pending: { cash: 0, card: 0, total: 0, items: [] },
          done:    { cash: 0, card: 0, total: 0, items: [] },
        });
      }

      const worker  = workerMap.get(uid)!;
      const isCash  = tx.method === FinanceTransactionMethod.CASH;
      const isCard  = tx.method === FinanceTransactionMethod.CARD;
      const bucket  = tx.handedOver ? worker.done : worker.pending;

      if (isCash) bucket.cash += tx.amount;
      if (isCard) bucket.card += tx.amount;
      bucket.total += tx.amount;

      bucket.items.push({
        transactionId: tx.id,
        orderId:       tx.orderId,
        clientName:    tx.order.name,
        clientPhone:   tx.order.phone,
        type:          tx.type,
        method:        tx.method,
        amount:        tx.amount,
        comment:       tx.comment,
        createdAt:     tx.createdAt,
        handedOver:    tx.handedOver,
        handedOverAt:  tx.handedOverAt,
        receivedBy:    tx.handedOverByName,
      });
    }

    // ── Summary (barcha workers bo'yicha) ─────────────────────────────────────
    const allWorkers = Array.from(workerMap.values());
    const summary = {
      pendingCash:  allWorkers.reduce((s, w) => s + w.pending.cash,  0),
      pendingCard:  allWorkers.reduce((s, w) => s + w.pending.card,  0),
      pendingTotal: allWorkers.reduce((s, w) => s + w.pending.total, 0),
      doneCash:     allWorkers.reduce((s, w) => s + w.done.cash,     0),
      doneCard:     allWorkers.reduce((s, w) => s + w.done.card,     0),
      doneTotal:    allWorkers.reduce((s, w) => s + w.done.total,    0),
    };

    // ── Pagination ────────────────────────────────────────────────────────────
    const page   = query.page  ?? 1;
    const limit  = query.limit ?? 20;
    const skip   = (page - 1) * limit;
    const total  = allWorkers.length;
    const pagedWorkers = allWorkers.slice(skip, skip + limit);

    const filter: Record<string, unknown> = {};
    if (query.userId  !== undefined) filter.userId  = query.userId;
    if (query.pending !== undefined) filter.pending = query.pending;

    return new ResponseDto(
      true,
      'Successfully found!',
      {
        dateRange: { from: query.from ?? null, to: query.to ?? null },
        ...(Object.keys(filter).length && { filter }),
        summary,
        workers: pagedWorkers,
      },
      { page, limit, total, totalPages: Math.ceil(total / limit) },
    );
  }

  async confirmHandover(
    sub: string,
    body: ConfirmHandoverDto,
  ) {
    // Faqat kiritilgan IDs lardagi pending transaksiyalarni topamiz
    const existing = await this.prisma.financeTransaction.findMany({
      where: {
        id:   { in: body.transactionIds },
        type: { in: [FinanceTransactionType.PREPAYMENT, FinanceTransactionType.PAYMENT] },
      },
      select: { id: true, handedOver: true },
    });

    if (existing.length === 0) {
      throw new BadRequestException(MSG.HANDOVER_NOT_FOUND);
    }

    const alreadyDone = existing.filter((t) => t.handedOver);
    if (alreadyDone.length > 0) {
      throw new BadRequestException(MSG.HANDOVER_ALREADY_DONE);
    }

    const receiver = await this.prisma.user.findUnique({
      where:  { id: sub },
      select: { name: true },
    });

    await this.prisma.financeTransaction.updateMany({
      where: { id: { in: body.transactionIds } },
      data:  {
        handedOver:       true,
        handedOverAt:     new Date(),
        handedOverById:   sub,
        handedOverByName: receiver?.name ?? null,
      },
    });

    return new ResponseDto(true, 'Muvaffaqiyatli tasdiqlandi', {
      confirmed: existing.length,
      receivedBy: receiver?.name ?? null,
    });
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
