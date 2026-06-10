import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';
import { MSG } from 'src/common/i18n/messages';
import {
  FinanceTransactionMethod,
  FinanceTransactionType,
  Role,
  Status,
} from '@prisma/client';
import { isUUID } from 'src/common/types/isUuid';
import {
  generateTelegramMessage,
  sendTelegramOrderChange,
  sendTelegramOrderDeleted,
  sendTelegramOrderDone,
  sendTelegramOrderForReport,
} from 'src/common/utils/send-telegram.bot';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    createOrderDto: CreateOrderDto,
    { sub, role },
  ): Promise<IResponse> {
    const {
      regionId,
      socialId,
      orderStatusId,
      endDateJob,
      workerArrivalDate,
      status,
      hashtagIds,
      payments,
      ...rest
    } = createOrderDto;

    const findUseer = await this.prisma.user.findUnique({
      where: { id: sub },
      select: {
        name: true,
        phone: true,
      },
    });

    const region = regionId
      ? await this.prisma.region.findUnique({ where: { id: regionId } })
      : null;
    if (regionId && !region) throw new NotFoundException(MSG.REGION_NOT_FOUND);

    const social = socialId
      ? await this.prisma.social.findUnique({ where: { id: socialId } })
      : null;
    if (socialId && !social) throw new NotFoundException(MSG.SOCIAL_NOT_FOUND);

    const orderStatus = orderStatusId
      ? await this.prisma.orderStatus.findUnique({
          where: { id: orderStatusId },
        })
      : null;
    if (orderStatusId && !orderStatus)
      throw new NotFoundException(MSG.ORDER_STATUS_NOT_FOUND);

    const safeWorkerArrivalDate =
      typeof workerArrivalDate === 'string'
        ? new Date(workerArrivalDate)
        : undefined;

    const safeEndDateJob =
      typeof endDateJob === 'string' ? new Date(endDateJob) : undefined;

    const order = await this.prisma.order.create({
      data: {
        regionId: region?.id || null,
        socialId: social?.id || null,
        orderStatusId: orderStatus?.id || null,
        status: status?.trim() ? status : undefined,
        workerArrivalDate: safeWorkerArrivalDate || null,
        endDateJob: safeEndDateJob || null,
        managerName: findUseer?.name || null,
        managerphone: findUseer?.phone || null,
        ...rest,
        hashtags: hashtagIds?.length
          ? { connect: hashtagIds.map((hid) => ({ id: hid })) }
          : undefined,
      },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: order.status,
        actorId: sub,
        actorName: findUseer?.name ?? null,
        actorRole: role,
      },
    });

    const financeData = (payments || []).map((p) => ({
      type: p.paymentType as unknown as FinanceTransactionType,
      method: p.paymentMethod as unknown as FinanceTransactionMethod | null,
      amount: p.amount,
      comment: p.comment,
      imageUrls: p.imageUrls ?? [],
      createdById: sub,
      orderId: order.id,
    }));

    await this.validatePayments(financeData);

    if (financeData.length > 0) {
      await this.prisma.financeTransaction.createMany({ data: financeData });
    }

    return new ResponseDto(true, 'Order created successfully', order);
  }

  async findAll(filters: {
    userId: string;
    userStatus: string;
    page?: number;
    limit?: number;
    orderStatusId?: string;
    socialId?: string;
    regionId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    endDateJob?: string;
    workerArrivalDate?: string;
    search?: string;
  }) {
    const {
      userStatus,
      page = 1,
      limit = 10,
      orderStatusId,
      regionId,
      socialId,
      status,
      startDate,
      endDate,
      endDateJob,
      workerArrivalDate,
      search,
    } = filters;

    const take = Number.isNaN(Number(limit)) ? 10 : Number(limit);
    const skip = Number.isNaN(Number(page)) ? 0 : (Number(page) - 1) * take;

    const where: any = {};

    if (typeof search === 'string' && search.trim().length > 2) {
      where.AND = [
        {
          OR: [
            { phone: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { region: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    if (orderStatusId && isUUID(orderStatusId)) {
      where.orderStatusId = orderStatusId;
    }
    if (regionId && isUUID(regionId)) {
      where.regionId = regionId;
    }
    if (socialId && isUUID(socialId)) {
      where.socialId = socialId;
    }
    if (userStatus === Role.ADMIN || userStatus === Role.MANAGER) {
      if (status && status.trim().length > 2) {
        where.status = status;
      }
    } else if (userStatus === Role.ZAMIR) {
      where.status = userStatus;
      where.zamirId = null;
    } else if (userStatus === Role.USTANOVCHIK) {
      where.status = userStatus;
      where.ustId = null;
    } else {
      where.status = userStatus;
      where.zavodId = null;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && startDate.trim().length > 2) {
        const date = new Date(startDate);
        if (!isNaN(date.getTime())) where.createdAt.gte = date;
      }
      if (endDate && endDate.trim().length > 2) {
        const date = new Date(endDate);
        if (!isNaN(date.getTime())) where.createdAt.lte = date;
      }
    }

    if (endDateJob && endDateJob.trim().length > 2) {
      const date = new Date(endDateJob);
      if (!isNaN(date.getTime())) where.endDateJob = { gte: date };
    }

    if (workerArrivalDate && workerArrivalDate.trim().length > 2) {
      const date = new Date(workerArrivalDate);
      if (!isNaN(date.getTime())) where.workerArrivalDate = { gte: date };
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
              imageUrls: true,
              createdBy: {
                select: { id: true, name: true, phone: true, role: true },
              },
              handedOver: true,
              handedOverAt: true,
              handedOverById: true,
              handedOverByName: true,
            },
          },
          hashtags: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const data = orders.map((order) => ({
      ...order,
      financeSummary: this.calcFinanceSummary(order.financeTransactions),
    }));

    return new ResponseDto(true, 'Successfully found!', data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  async findOne(id: string): Promise<IResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id },
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
              select: { id: true, name: true, phone: true, role: true },
            },
            handedOver: true,
            handedOverAt: true,
            handedOverById: true,
            handedOverByName: true,
          },
        },
        hashtags: true,
      },
    });

    if (!order) {
      throw new BadRequestException(MSG.ORDER_NOT_FOUND);
    }

    return new ResponseDto(true, 'Order found', {
      ...order,
      financeSummary: this.calcFinanceSummary(order.financeTransactions),
    });
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    { sub, role },
  ): Promise<IResponse> {
    const { status } = updateOrderDto;

    const findOrder = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        comment: true,
        endDateJob: true,
        workerArrivalDate: true,
        total: true,
        prePayment: true,
        dueAmount: true,
        regionId: true,
        longitude: true,
        latitude: true,
        socialId: true,
        status: true,
        managerId: true,
        managerName: true,
        managerphone: true,
        zamirId: true,
        zamirName: true,
        zamirPhone: true,
        ustId: true,
        ustName: true,
        ustPhone: true,
        zavodId: true,
        zavodName: true,
        zavodPhone: true,
        getAllPaymentDate: true,
        getPrePaymentDate: true,
      },
    });

    if (!findOrder) {
      throw new BadRequestException(MSG.ORDER_NOT_FOUND);
    }

    if (
      role === Role.ADMIN ||
      role === Role.MANAGER ||
      findOrder.zamirId === sub ||
      findOrder.ustId === sub ||
      findOrder.zavodId === sub
    ) {
      const findUseer = await this.prisma.user.findUnique({
        where: { id: sub },
        select: {
          name: true,
          phone: true,
        },
      });

      if (role === 'ZAMIR') {
        await this.prisma.order.update({
          where: { id },
          data: {
            zamirName: findUseer?.name || null,
            zamirPhone: findUseer?.phone || null,
          },
        });
      } else if (role === 'USTANOVCHIK') {
        await this.prisma.order.update({
          where: { id },
          data: {
            ustName: findUseer?.name || null,
            ustPhone: findUseer?.phone || null,
          },
        });
      } else if (role === 'ZAVOD') {
        await this.prisma.order.update({
          where: { id },
          data: {
            zavodName: findUseer?.name || null,
            zavodPhone: findUseer?.phone || null,
          },
        });
      }

      const { payments, startCurrency, endCurrency, hashtagIds, ...orderData } =
        updateOrderDto;

      // Record every status transition
      if (status && status !== findOrder.status) {
        await this.prisma.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: findOrder.status,
            toStatus: status as unknown as Status,
            actorId: sub,
            actorName: findUseer?.name ?? null,
            actorRole: role,
          },
        });
      }

      const changeOrder = await this.prisma.order.update({
        where: { id },
        data: {
          ...orderData,
          orderStatusId:
            status === Status.ZAMIR ? null : orderData.orderStatusId,
          ...(hashtagIds !== undefined && {
            hashtags: { set: hashtagIds.map((hid) => ({ id: hid })) },
          }),
        },
        include: {
          region: true,
          social: true,
          orderStatus: true,
          roomMeasurement: true,
          currencyOrder: true,
          hashtags: true,
        },
      });

      const mapCurrency = (
        items: { type: 'card' | 'cash'; amount: number }[],
        isPrePayment: boolean,
      ) =>
        items?.map(({ type, amount }) => ({
          card: type === 'card' ? amount : 0,
          cash: type === 'cash' ? amount : 0,
          orederId: id,
          isPrePayment,
        })) ?? [];

      const currencies = [
        ...mapCurrency(startCurrency || [], true),
        ...mapCurrency(endCurrency || [], false),
      ];

      const financeData = (payments || []).map((p) => ({
        type: p.paymentType as unknown as FinanceTransactionType,
        method: p.paymentMethod as unknown as FinanceTransactionMethod | null,
        amount: p.amount,
        comment: p.comment,
        imageUrls: p.imageUrls ?? [],
        createdById: sub,
        orderId: id,
      }));

      await this.validatePayments(financeData, id);

      if (status === Status.CANCEL) {
        const REVERSAL_MAP: Partial<
          Record<FinanceTransactionType, FinanceTransactionType>
        > = {
          [FinanceTransactionType.SALE]: FinanceTransactionType.SALE_CANCEL,
          [FinanceTransactionType.SALE_ADDITION]:
            FinanceTransactionType.SALE_CANCEL,
          [FinanceTransactionType.PREPAYMENT]: FinanceTransactionType.REFUND,
          [FinanceTransactionType.PAYMENT]: FinanceTransactionType.REFUND,
        };

        const existingTxs = await this.prisma.financeTransaction.findMany({
          where: { orderId: id },
          select: { type: true, method: true, amount: true },
        });

        for (const tx of existingTxs) {
          const reversalType = REVERSAL_MAP[tx.type];
          if (reversalType) {
            financeData.push({
              type: reversalType,
              method: tx.method,
              amount: tx.amount,
              comment: undefined,
              imageUrls: [],
              createdById: sub,
              orderId: id,
            });
          }
        }
      }

      await Promise.all([
        currencies.length
          ? this.prisma.currencyOrder.createMany({ data: currencies })
          : Promise.resolve(),
        financeData.length
          ? this.prisma.financeTransaction.createMany({ data: financeData })
          : Promise.resolve(),
      ]);

      const sendTelegram = async (type: 'new' | 'changed' | 'done') => {
        const rooms = await this.prisma.roomMeasurement.findMany({
          where: { orderId: id },
          select: { name: true, key: true, value: true },
        });

        const data = {
          name: changeOrder.name || 'name',
          phone: changeOrder.phone || 'phone',
          comment: changeOrder.comment || '',
          regionName: changeOrder.region?.name || 'default',
          lon: changeOrder.longitude || 0,
          lat: changeOrder.latitude || 0,
          workerArriveDate: changeOrder.workerArrivalDate?.toString() || '',
          endedjobDate: changeOrder.endDateJob?.toString() || '',
          rooms: rooms.map((room) => ({
            name: room.name || '',
            key: room.key || '',
            value: room.value || '',
          })),
        };

        if (type === 'new') generateTelegramMessage(data);
        else if (type === 'changed') sendTelegramOrderChange(data);
        else if (type === 'done') sendTelegramOrderDone(data);
      };

      if (findOrder.status === Status.ZAMIR && status === Status.ZAVOD) {
        await Promise.allSettled([
          sendTelegramOrderForReport(changeOrder),
          sendTelegram('new'),
        ]);
      } else if (
        !status ||
        (findOrder.status === Status.ZAVOD && status === Status.ZAVOD)
      ) {
        await sendTelegram('changed');
      } else if (status === Status.DONE) {
        await sendTelegram('done');
      }

      return new ResponseDto(true, 'Order updated successfully');
    } else {
      throw new BadRequestException(MSG.ORDER_UPDATE_FORBIDDEN);
    }
  }

  async remove(id: string, userId: string): Promise<IResponse> {
    const [findOrder, user] = await Promise.all([
      this.prisma.order.findUnique({
        where: { id },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, phone: true },
      }),
    ]);

    if (!findOrder || !user) {
      throw new BadRequestException(MSG.ORDER_NOT_FOUND);
    }

    const relatedOrders = await this.prisma.roomMeasurement.findMany({
      where: { orderId: id },
      select: {
        id: true,
      },
    });

    const ids = relatedOrders.map((order) => order.id);
    if (ids.length !== 0) {
      await this.prisma.roomMeasurement.deleteMany({
        where: { id: { in: ids } },
      });
    }

    await Promise.all([
      this.prisma.order.delete({
        where: { id },
      }),
      sendTelegramOrderDeleted(findOrder, {
        id: userId,
        name: user.name,
        phone: user.phone,
      }),
    ]);

    return new ResponseDto(true, 'Order deleted successfully');
  }

  async getOrderByOrderId(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        zamirId: true,
        ustId: true,
        zavodId: true,
        managerId: true,
      },
    });

    if (!order) {
      throw new NotFoundException(MSG.ORDER_NOT_FOUND);
    }

    if (role === Status.ZAMIR && !order.zamirId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          zamirId: userId,
        },
      });
    } else if (role === Status.USTANOVCHIK && !order.ustId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          ustId: userId,
        },
      });
    } else if (role === Status.ZAVOD && !order.zavodId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          zavodId: userId,
        },
      });
    } else if (order.zavodId || order.ustId || order.zamirId) {
      throw new BadRequestException(MSG.ORDER_ALREADY_ASSIGNED);
    } else {
      throw new BadRequestException(MSG.ORDER_ASSIGN_FORBIDDEN);
    }
  }

  async assignOrders(orderIds: string[], userId: string, role: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
      select: {
        id: true,
        zamirId: true,
        ustId: true,
        zavodId: true,
        managerId: true,
      },
    });

    if (orders.length === 0) {
      throw new NotFoundException(MSG.ORDERS_NOT_FOUND);
    }

    const updatePromises: Promise<any>[] = [];

    for (const order of orders) {
      const { id, zamirId, ustId, zavodId } = order;

      if (role === Status.ZAMIR && !zamirId) {
        updatePromises.push(
          this.prisma.order.update({
            where: { id },
            data: { zamirId: userId },
          }),
        );
      } else if (role === Status.USTANOVCHIK && !ustId) {
        updatePromises.push(
          this.prisma.order.update({
            where: { id },
            data: { ustId: userId },
          }),
        );
      } else if (role === Status.ZAVOD && !zavodId) {
        updatePromises.push(
          this.prisma.order.update({
            where: { id },
            data: { zavodId: userId },
          }),
        );
      } else if (zamirId || ustId || zavodId) {
        throw new BadRequestException(MSG.ORDER_ALREADY_ASSIGNED);
      } else {
        throw new BadRequestException(MSG.ORDER_ASSIGN_FORBIDDEN);
      }
    }

    await Promise.all(updatePromises);

    return new ResponseDto(true, 'Orders successfully assigned');
  }

  async unassignOrders(orderIds: string[], userId: string, role: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
      select: {
        id: true,
        zamirId: true,
        ustId: true,
        zavodId: true,
        managerId: true,
      },
    });
    if (orders.length === 0) {
      throw new NotFoundException(MSG.ORDERS_NOT_FOUND);
    }
    const updatePromises: Promise<any>[] = [];
    for (const order of orders) {
      const { id, zamirId, ustId, zavodId } = order;
      if (role === Status.ZAMIR && zamirId === userId) {
        updatePromises.push(
          this.prisma.order.update({
            where: { id },
            data: { zamirId: null },
          }),
        );
      } else if (role === Status.USTANOVCHIK && ustId === userId) {
        updatePromises.push(
          this.prisma.order.update({
            where: { id },
            data: { ustId: null },
          }),
        );
      } else if (role === Status.ZAVOD && zavodId === userId) {
        updatePromises.push(
          this.prisma.order.update({
            where: { id },
            data: { zavodId: null },
          }),
        );
      } else if (
        (zamirId && zamirId !== userId) ||
        (ustId && ustId !== userId) ||
        (zavodId && zavodId !== userId)
      ) {
        throw new BadRequestException(MSG.ORDER_ALREADY_ASSIGNED);
      } else {
        throw new BadRequestException(MSG.ORDER_UNASSIGN_FORBIDDEN);
      }
    }
    await Promise.all(updatePromises);
    return new ResponseDto(true, 'Orders successfully unassigned');
  }

  async getMyOrders(userId: string, role: string): Promise<IResponse> {
    const where: any = {
      OR: [
        { zamirId: userId, status: Status.ZAMIR },
        { ustId: userId, status: Status.USTANOVCHIK },
        { zavodId: userId, status: Status.ZAVOD },
      ],
    };

    if (role === Role.ZAMIR) {
      where.zamirId = userId;
    } else if (role === Role.USTANOVCHIK) {
      where.ustId = userId;
    } else if (role === Role.ZAVOD) {
      where.zavodId = userId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        region: true,
        social: true,
        orderStatus: true,
        roomMeasurement: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return new ResponseDto(true, 'My orders found', orders);
  }

  private async validatePayments(
    financeData: { type: FinanceTransactionType; amount: number }[],
    orderId?: string,
  ): Promise<void> {
    if (financeData.length === 0) return;

    // ── 1. Bir so'rovda ikki SALE bo'lmasin ───────────────────────────────────
    const incomingSaleCount = financeData.filter(
      (p) => p.type === FinanceTransactionType.SALE,
    ).length;

    if (incomingSaleCount > 1) {
      throw new BadRequestException(MSG.SALE_ALREADY_EXISTS);
    }

    // ── Mavjud transaksiyalarni bir marta olish ────────────────────────────────
    const existing = orderId
      ? await this.prisma.financeTransaction.findMany({
          where: { orderId },
          select: { type: true, amount: true },
        })
      : [];

    const hasSaleInDB = existing.some(
      (tx) => tx.type === FinanceTransactionType.SALE,
    );

    // ── 2. SALE constraint ─────────────────────────────────────────────────────
    if (incomingSaleCount === 1 && hasSaleInDB) {
      throw new BadRequestException(MSG.SALE_ALREADY_EXISTS);
    }

    if (incomingSaleCount === 0 && !hasSaleInDB) {
      throw new BadRequestException(MSG.SALE_REQUIRED);
    }

    // ── 3. To'lov umumiy summadan oshmasin ─────────────────────────────────────
    const allTxs = [...existing, ...financeData];

    const netSale = allTxs.reduce((sum, tx) => {
      if (tx.type === FinanceTransactionType.SALE) return sum + tx.amount;
      if (tx.type === FinanceTransactionType.SALE_ADDITION)
        return sum + tx.amount;
      if (tx.type === FinanceTransactionType.SALE_CANCEL)
        return sum - tx.amount;
      return sum;
    }, 0);

    const paid = allTxs.reduce((sum, tx) => {
      if (tx.type === FinanceTransactionType.PREPAYMENT) return sum + tx.amount;
      if (tx.type === FinanceTransactionType.PAYMENT) return sum + tx.amount;
      if (tx.type === FinanceTransactionType.REFUND) return sum - tx.amount;
      return sum;
    }, 0);

    if (paid > netSale) {
      throw new BadRequestException(MSG.PAYMENT_EXCEEDS_SALE);
    }
  }

  private calcFinanceSummary(
    transactions: { type: FinanceTransactionType; amount: number }[],
  ) {
    let sale = 0,
      saleAddition = 0,
      saleCancel = 0;
    let prepayment = 0,
      payment = 0,
      refund = 0;

    for (const tx of transactions ?? []) {
      switch (tx.type) {
        case FinanceTransactionType.SALE:
          sale += tx.amount;
          break;
        case FinanceTransactionType.SALE_ADDITION:
          saleAddition += tx.amount;
          break;
        case FinanceTransactionType.SALE_CANCEL:
          saleCancel += tx.amount;
          break;
        case FinanceTransactionType.PREPAYMENT:
          prepayment += tx.amount;
          break;
        case FinanceTransactionType.PAYMENT:
          payment += tx.amount;
          break;
        case FinanceTransactionType.REFUND:
          refund += tx.amount;
          break;
      }
    }

    const currentTotal = sale + saleAddition - saleCancel;
    const paidAmount = prepayment + payment - refund;
    return { currentTotal, paidAmount, debtAmount: currentTotal - paidAmount };
  }
}
