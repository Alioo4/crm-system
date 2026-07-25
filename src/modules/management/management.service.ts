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
  ManagementSort,
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
  managerAssignedAt: true,
  zamirId: true,
  zamirName: true,
  zamirAssignedAt: true,
  zavodId: true,
  zavodName: true,
  zavodAssignedAt: true,
  ustId: true,
  ustName: true,
  ustAssignedAt: true,
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

// Ish oqimi pipeline'i — indeks = bosqich tartibi. CANCEL pipeline'da yo'q (indexOf → -1).
const PIPELINE: Status[] = [
  Status.MANAGER,
  Status.ZAMIR,
  Status.ZAVOD,
  Status.USTANOVCHIK,
  Status.DONE,
];

// Har ishchi sloti va unga mos bosqich (status).
const SLOTS = [
  { id: 'managerId', stage: Status.MANAGER },
  { id: 'zamirId', stage: Status.ZAMIR },
  { id: 'zavodId', stage: Status.ZAVOD },
  { id: 'ustId', stage: Status.USTANOVCHIK },
] as const;

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

    // Har slotning o'z bosqichi (statusi) bor. matchId: userIds bo'lsa shu ishchilar,
    // aks holda slot to'ldirilgan bo'lishi kifoya.
    const matchId: Prisma.StringNullableFilter = userIds
      ? { in: userIds }
      : { not: null };

    // assigned = ishchi sloti to'ldirilgan VA order aynan uning bosqichida (joriy navbat).
    // Sana order yaratilgan sanasi bo'yicha (hozirgidek).
    const assignedWhere: Prisma.OrderWhereInput = {
      OR: SLOTS.map(
        (s) => ({ [s.id]: matchId, status: s.stage }) as Prisma.OrderWhereInput,
      ),
      ...(dateRange && { createdAt: dateRange }),
    };

    // completed = ishchi bosqichidan yuqoriga o'tgan (yoki DONE) orderlar.
    // userIds bo'lmasa order-darajasida faqat DONE. Sana filtri/saralashi bosqich
    // tugash vaqti (stageCompletedAt) bo'yicha bo'lgani uchun xotirada bajariladi.
    const completedStatusWhere: Prisma.OrderWhereInput = userIds
      ? {
          OR: SLOTS.map(
            (s) =>
              ({
                [s.id]: { in: userIds },
                status: { in: this.statusesAfter(s.stage) },
              }) as Prisma.OrderWhereInput,
          ),
        }
      : { status: Status.DONE };

    // counts — har doim ikkala tab uchun (TZ 3.1).
    const assignedCount = await this.prisma.order.count({ where: assignedWhere });

    // Completed rowlarni sana filtri berilganda (yoki completed tab tanlanganda) yuklab,
    // bosqich-tugash vaqtini hisoblaymiz; aks holda arzon count() kifoya.
    let completedProcessed: { o: ManagementOrderRow; t: Date }[] | null = null;
    let completedCount: number;
    if (dateRange || query.tab === ManagementTab.COMPLETED) {
      const rows = await this.prisma.order.findMany({
        where: completedStatusWhere,
        select: orderSelect,
      });
      completedProcessed = rows
        .map((o) => ({ o, t: this.stageCompletedAt(o, userIds) }))
        .filter(
          (x): x is { o: ManagementOrderRow; t: Date } =>
            x.t !== null && (!dateRange || this.inRange(x.t, dateRange)),
        );
      completedCount = completedProcessed.length;
    } else {
      completedCount = await this.prisma.order.count({
        where: completedStatusWhere,
      });
    }
    const counts = { assigned: assignedCount, completed: completedCount };

    let orders: ReturnType<typeof this.buildManagementOrder>[];
    let total: number;

    if (query.tab === ManagementTab.ASSIGNED) {
      total = assignedCount;
      const sort = query.sort ?? ManagementSort.NEW;

      if (sort === ManagementSort.OLD) {
        // old = eski orderlar (assign date yo'q) → createdAt bo'yicha, eng eskisi birinchi.
        // createdAt real ustun → DB darajasida saralash + sahifalash.
        const rows = await this.prisma.order.findMany({
          where: assignedWhere,
          select: orderSelect,
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
        });
        orders = rows.map((o) => this.buildManagementOrder(o, ManagementTab.ASSIGNED));
      } else {
        // new = eng oxirgi assign vaqti bo'yicha (4 ustundan eng kechi), yangisi birinchi.
        // GREATEST(nullable ustunlar) Prisma orderBy'da yo'q → xotirada saralash (completed pattern'i).
        const rows = await this.prisma.order.findMany({
          where: assignedWhere,
          select: orderSelect,
        });
        orders = rows
          .sort((a, b) => this.effectiveAssignedAt(b) - this.effectiveAssignedAt(a))
          .slice(skip, skip + limit)
          .map((o) => this.buildManagementOrder(o, ManagementTab.ASSIGNED));
      }
    } else {
      // completed = bosqich-tugash vaqti (stageCompletedAt) bo'yicha desc saralash + sahifalash.
      // completedProcessed yuqorida hisoblangan (completed tab → doim to'ldiriladi).
      total = completedCount;
      orders = completedProcessed!
        .sort((a, b) => b.t.getTime() - a.t.getTime())
        .slice(skip, skip + limit)
        .map((x) =>
          this.buildManagementOrder(x.o, ManagementTab.COMPLETED, x.t),
        );
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

  // Order uchun effektiv assign vaqti = 4 rol assign vaqtidan eng kechi (max).
  // Hech biri yo'q bo'lsa (eski orderlar) → createdAt fallback.
  private effectiveAssignedAt(o: ManagementOrderRow): number {
    const ts = [
      o.managerAssignedAt,
      o.zamirAssignedAt,
      o.zavodAssignedAt,
      o.ustAssignedAt,
    ]
      .filter((d): d is Date => d != null)
      .map((d) => d.getTime());
    return ts.length ? Math.max(...ts) : o.createdAt.getTime();
  }

  // Pipeline'dagi bosqich tartibi (CANCEL → -1).
  private statusRank(s: Status): number {
    return PIPELINE.indexOf(s);
  }

  // Berilgan bosqichdan keyingi statuslar (DONE ham).
  private statusesAfter(stage: Status): Status[] {
    return PIPELINE.slice(PIPELINE.indexOf(stage) + 1);
  }

  private inRange(d: Date, r: { gte?: Date; lte?: Date }): boolean {
    return (!r.gte || d >= r.gte) && (!r.lte || d <= r.lte);
  }

  // Ishchi bosqichi tugagan vaqt = eng yuqori "o'tib bo'lingan" slot bosqichidan keyingi
  // birinchi statusHistory o'tishi. userIds berilsa faqat shu ishchilar slotlari hisobga olinadi.
  private stageCompletedAt(
    order: ManagementOrderRow,
    userIds: string[] | null,
  ): Date | null {
    const orderRank = this.statusRank(order.status);
    if (orderRank < 0) return null; // CANCEL

    const slots = [
      { id: order.managerId, stage: Status.MANAGER },
      { id: order.zamirId, stage: Status.ZAMIR },
      { id: order.zavodId, stage: Status.ZAVOD },
      { id: order.ustId, stage: Status.USTANOVCHIK },
    ];

    const passed = slots.filter(
      (s) =>
        s.id &&
        (!userIds || userIds.includes(s.id)) &&
        this.statusRank(s.stage) < orderRank,
    );
    if (!passed.length) return null;

    const highestRank = Math.max(...passed.map((s) => this.statusRank(s.stage)));
    // statusHistory asc tartibda → .find eng erta o'tishni beradi.
    const hist = (order.statusHistory ?? []).find(
      (x) => this.statusRank(x.toStatus) > highestRank,
    );
    return hist ? hist.createdAt : order.createdAt;
  }

  private buildManagementOrder(
    order: ManagementOrderRow,
    tab: ManagementTab,
    completedAt: Date | null = null,
  ) {
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
    // doneAt = ishchi bosqichi tugagan vaqt (completed tab uchun getOrders'dan uzatiladi).
    const doneAt: Date | null = completedAt;

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
