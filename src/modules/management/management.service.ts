import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  FinanceTransactionType,
  Prisma,
  Role,
  Status,
  UserStatus,
} from '@prisma/client';
import { ResponseDto } from 'src/common/types';
import { MSG } from 'src/common/i18n/messages';
import { PrismaService } from '../prisma/prisma.service';
import {
  ManagementOrdersQueryDto,
  ManagementPeriod,
  ManagementTab,
} from './dto/management-orders-query.dto';

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

// Order status / user role -> frontend uchun kichik harfli yorliq (TZ misolidagidek).
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ZAMIR: 'zamer',
  ZAVOD: 'zavod',
  USTANOVCHIK: 'ustanovchik',
};

type TxLite = {
  type: FinanceTransactionType;
  amount: number;
  createdById: string | null;
};

// findMany select — `satisfies` literal turni saqlaydi, shu sabab Prisma payload'ni to'liq infer qiladi.
const orderSelect = {
  id: true,
  name: true,
  phone: true,
  status: true,
  createdAt: true,
  managerId: true,
  managerName: true,
  zamirId: true,
  zamirName: true,
  zavodId: true,
  zavodName: true,
  ustId: true,
  ustName: true,
  region: { select: { name: true } },
  financeTransactions: {
    select: { type: true, amount: true, createdById: true },
  },
  statusHistory: {
    select: { toStatus: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.OrderSelect;

type ManagementOrderRow = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;

@Injectable()
export class ManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 1. Orders ──────────────────────────────────────────────────────────────

  async getOrders(role: string, query: ManagementOrdersQueryDto) {
    this.checkAccess(role);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const dateRange = this.resolveDateRange(query);
    const userIds = query.userIds?.length ? query.userIds : null;

    const workerFilter: Prisma.OrderWhereInput = userIds
      ? {
          OR: [
            { managerId: { in: userIds } },
            { zamirId: { in: userIds } },
            { zavodId: { in: userIds } },
            { ustId: { in: userIds } },
          ],
        }
      : {};

    // assigned = biriktirilgan, hali Done/Cancel emas → sana order yaratilgan sanasi bo'yicha.
    const assignedWhere: Prisma.OrderWhereInput = {
      ...workerFilter,
      status: { notIn: [Status.DONE, Status.CANCEL] },
      ...(dateRange && { createdAt: dateRange }),
    };

    // completed = Done → sana order DONE bo'lgan haqiqiy sana bo'yicha (OrderStatusHistory).
    const completedWhere: Prisma.OrderWhereInput = {
      ...workerFilter,
      status: Status.DONE,
      ...(dateRange && {
        statusHistory: {
          some: { toStatus: Status.DONE, createdAt: dateRange },
        },
      }),
    };

    // counts — har doim ikkala tab uchun (TZ 3.1).
    const [assignedCount, completedCount] = await Promise.all([
      this.prisma.order.count({ where: assignedWhere }),
      this.prisma.order.count({ where: completedWhere }),
    ]);
    const counts = { assigned: assignedCount, completed: completedCount };

    let orders: ReturnType<typeof this.buildManagementOrder>[];
    let total: number;

    if (query.tab === ManagementTab.ASSIGNED) {
      // createdAt real ustun → DB darajasida saralash + sahifalash.
      total = assignedCount;
      const rows = await this.prisma.order.findMany({
        where: assignedWhere,
        select: orderSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
      orders = rows.map((o) => this.buildManagementOrder(o, ManagementTab.ASSIGNED));
    } else {
      // doneAt hosila maydon → xotirada saralash + sahifalash (finance moduli pattern'i).
      total = completedCount;
      const rows = await this.prisma.order.findMany({
        where: completedWhere,
        select: orderSelect,
      });
      orders = rows
        .map((o) => this.buildManagementOrder(o, ManagementTab.COMPLETED))
        .sort((a, b) => {
          const av = a.doneAt ? a.doneAt.getTime() : 0;
          const bv = b.doneAt ? b.doneAt.getTime() : 0;
          return bv - av;
        })
        .slice(skip, skip + limit);
    }

    return new ResponseDto(
      true,
      'Successfully found!',
      { counts, orders },
      { page, limit, total, totalPages: Math.ceil(total / limit) },
    );
  }

  // ─── 2. Users (filter dropdown) ───────────────────────────────────────────────

  async getUsers(role: string) {
    this.checkAccess(role);

    const users = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        role: {
          in: [Role.MANAGER, Role.ZAMIR, Role.ZAVOD, Role.USTANOVCHIK],
        },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });

    const mapped = users.map((u) => ({
      id: u.id,
      name: u.name,
      role: ROLE_LABELS[u.role] ?? u.role.toLowerCase(),
    }));

    return new ResponseDto(true, 'Successfully found!', { users: mapped });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private checkAccess(role: string) {
    if (role !== Role.ADMIN && role !== Role.MANAGER) {
      throw new ForbiddenException(MSG.PERMISSION_DENIED);
    }
  }

  private buildManagementOrder(order: ManagementOrderRow, tab: ManagementTab) {
    const txs: TxLite[] = order.financeTransactions;

    const totalAmount = this.calcOrderAmount(txs);
    const paidAmount = this.calcPaidAmount(txs);
    const workerAmountMap = this.buildWorkerAmountMap(txs);

    const history = order.statusHistory ?? [];
    // Rolega birinchi o'tgan sana (assignedAt), topilmasa order.createdAt (TZ 5.4 fallback).
    const firstTransitionTo = (status: Status): Date => {
      const h = history.find((x) => x.toStatus === status);
      return h ? h.createdAt : order.createdAt;
    };
    // Oxirgi DONE'ga o'tish sanasi (asc tartibda kelgani uchun oxirgisi).
    const doneHistory = history.filter((x) => x.toStatus === Status.DONE);
    const doneAt: Date | null = doneHistory.length
      ? doneHistory[doneHistory.length - 1].createdAt
      : null;

    const workerDefs: {
      userId: string | null;
      name: string | null;
      role: string;
      status: Status;
    }[] = [
      { userId: order.managerId, name: order.managerName, role: 'manager', status: Status.MANAGER },
      { userId: order.zamirId, name: order.zamirName, role: 'zamer', status: Status.ZAMIR },
      { userId: order.zavodId, name: order.zavodName, role: 'zavod', status: Status.ZAVOD },
      { userId: order.ustId, name: order.ustName, role: 'ustanovchik', status: Status.USTANOVCHIK },
    ];

    const workers = workerDefs
      .filter((w) => w.userId)
      .map((w) => ({
        userId: w.userId as string,
        name: w.name,
        role: w.role,
        assignedAt: firstTransitionTo(w.status),
        receivedAmount: workerAmountMap.get(w.userId as string) ?? 0,
      }));

    return {
      id: order.id,
      orderNumber: order.id, // schema'da alohida order raqami yo'q — id ishlatiladi.
      status: order.status,
      createdAt: order.createdAt,
      doneAt: tab === ManagementTab.COMPLETED ? doneAt : null,
      client: {
        name: order.name,
        phone: order.phone,
        address: order.region?.name ?? null,
      },
      finance: {
        totalAmount,
        paidAmount,
        remainingAmount: totalAmount - paidAmount,
      },
      workers,
    };
  }

  // totalAmount = SALE + SALE_ADDITION − SALE_CANCEL (finance moduli bilan bir xil).
  private calcOrderAmount(txs: TxLite[]): number {
    return txs.reduce((sum, tx) => {
      if (tx.type === FinanceTransactionType.SALE) return sum + tx.amount;
      if (tx.type === FinanceTransactionType.SALE_ADDITION) return sum + tx.amount;
      if (tx.type === FinanceTransactionType.SALE_CANCEL) return sum - tx.amount;
      return sum;
    }, 0);
  }

  // paidAmount = PREPAYMENT + PAYMENT − REFUND.
  private calcPaidAmount(txs: TxLite[]): number {
    return txs.reduce((sum, tx) => {
      if (tx.type === FinanceTransactionType.PREPAYMENT) return sum + tx.amount;
      if (tx.type === FinanceTransactionType.PAYMENT) return sum + tx.amount;
      if (tx.type === FinanceTransactionType.REFUND) return sum - tx.amount;
      return sum;
    }, 0);
  }

  // Har bir user qabul qilgan pul (createdById bo'yicha net) — TZ 4.4.
  private buildWorkerAmountMap(txs: TxLite[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const tx of txs) {
      if (!tx.createdById) continue;
      const current = map.get(tx.createdById) ?? 0;
      if (
        tx.type === FinanceTransactionType.PREPAYMENT ||
        tx.type === FinanceTransactionType.PAYMENT
      ) {
        map.set(tx.createdById, current + tx.amount);
      } else if (tx.type === FinanceTransactionType.REFUND) {
        map.set(tx.createdById, current - tx.amount);
      }
    }
    return map;
  }

  // period → sana oralig'i. DB timestamplari UTC+5 wall-clock sifatida saqlanadi
  // (timezoneOffsetMiddleware), shuning uchun chegaralar ham shu frame'da hisoblanadi.
  private resolveDateRange(
    query: ManagementOrdersQueryDto,
  ): { gte?: Date; lte?: Date } | null {
    const period = query.period ?? ManagementPeriod.ALL;

    if (period === ManagementPeriod.ALL) return null;

    if (period === ManagementPeriod.CUSTOM) {
      if (!query.from && !query.to) {
        throw new BadRequestException(
          "period=custom bo'lsa from yoki to majburiy",
        );
      }
      const range: { gte?: Date; lte?: Date } = {};
      if (query.from) range.gte = this.dayStartFromString(query.from);
      if (query.to) range.lte = this.dayEndFromString(query.to);
      return range;
    }

    // Toshkent (UTC+5) kalendar sanasi.
    const now = new Date(Date.now() + TASHKENT_OFFSET_MS);
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();

    const dayStart = (yy: number, mm: number, dd: number) =>
      new Date(Date.UTC(yy, mm, dd, 0, 0, 0, 0));
    const dayEnd = (yy: number, mm: number, dd: number) =>
      new Date(Date.UTC(yy, mm, dd, 23, 59, 59, 999));

    switch (period) {
      case ManagementPeriod.TODAY:
        return { gte: dayStart(y, m, d), lte: dayEnd(y, m, d) };
      case ManagementPeriod.YESTERDAY:
        return { gte: dayStart(y, m, d - 1), lte: dayEnd(y, m, d - 1) };
      case ManagementPeriod.THIS_MONTH:
        // Date.UTC(y, m+1, 0) = joriy oyning oxirgi kuni.
        return { gte: dayStart(y, m, 1), lte: dayEnd(y, m + 1, 0) };
      case ManagementPeriod.LAST_MONTH:
        return { gte: dayStart(y, m - 1, 1), lte: dayEnd(y, m, 0) };
      default:
        return null;
    }
  }

  private dayStartFromString(dateStr: string): Date {
    const d = new Date(dateStr);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private dayEndFromString(dateStr: string): Date {
    const d = new Date(dateStr);
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }
}
