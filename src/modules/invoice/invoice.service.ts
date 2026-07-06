import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';
import { MSG } from 'src/common/i18n/messages';
import { InvoiceItemDto, UpsertInvoiceDto } from './dto/upsert-invoice.dto';

// Snapshot bilan birga saqlanadigan item ma'lumoti (validatsiyadan o'tgan).
type PreparedItem = {
  serviceId: string;
  serviceName: string;
  serviceDescription: string | null;
  position: number;
  price: number;
  quantity: number;
  isPercentDiscount: boolean;
  discountValue: number;
};

// Prismadan qaytgan invoice + items (hisob-kitob uchun kerakli fieldlar).
type StoredItem = {
  id: string;
  serviceId: string | null;
  serviceName: string;
  serviceDescription: string | null;
  price: number;
  quantity: number;
  isPercentDiscount: boolean;
  discountValue: number;
};

const INVOICE_INCLUDE = {
  items: {
    orderBy: { position: 'asc' as const },
    select: {
      id: true,
      serviceId: true,
      serviceName: true,
      serviceDescription: true,
      price: true,
      quantity: true,
      isPercentDiscount: true,
      discountValue: true,
    },
  },
} as const;

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GET /orders/:orderId/invoice ─────────────────────────────────────────────
  async findOne(orderId: string): Promise<IResponse> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
      include: INVOICE_INCLUDE,
    });

    // 404 — invoice yo'q degan ma'no (xatolik emas, client 'yaratish' tugmasini ko'rsatadi).
    if (!invoice) {
      throw new NotFoundException(MSG.INVOICE_NOT_FOUND);
    }

    return new ResponseDto(true, 'Successfully found!', this.build(invoice));
  }

  // ─── POST /orders/:orderId/invoice ────────────────────────────────────────────
  async create(orderId: string, dto: UpsertInvoiceDto): Promise<IResponse> {
    await this.ensureOrderExists(orderId);

    const existing = await this.prisma.invoice.findUnique({
      where: { orderId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(MSG.INVOICE_ALREADY_EXISTS);
    }

    const items = await this.prepareItems(dto.items);
    this.validateInvoiceDiscount(dto, items);

    const invoice = await this.prisma.invoice.create({
      data: {
        orderId,
        isPercentDiscount: dto.isPercentDiscount,
        discountValue: dto.discountValue,
        comment: dto.comment ?? null,
        items: { create: items },
      },
      include: INVOICE_INCLUDE,
    });

    return new ResponseDto(true, 'Invoice created successfully', this.build(invoice));
  }

  // ─── PATCH /orders/:orderId/invoice ───────────────────────────────────────────
  async update(orderId: string, dto: UpsertInvoiceDto): Promise<IResponse> {
    const current = await this.prisma.invoice.findUnique({
      where: { orderId },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException(MSG.INVOICE_NOT_FOUND);
    }

    const items = await this.prepareItems(dto.items);
    this.validateInvoiceDiscount(dto, items);

    // Itemlar to'liq almashtiriladi: eskilarini o'chirib, yangisini yaratamiz.
    const invoice = await this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: current.id } });
      return tx.invoice.update({
        where: { id: current.id },
        data: {
          isPercentDiscount: dto.isPercentDiscount,
          discountValue: dto.discountValue,
          comment: dto.comment ?? null,
          items: { create: items },
        },
        include: INVOICE_INCLUDE,
      });
    });

    return new ResponseDto(true, 'Invoice updated successfully', this.build(invoice));
  }

  // ─── DELETE /orders/:orderId/invoice ──────────────────────────────────────────
  async remove(orderId: string): Promise<IResponse> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
      select: { id: true },
    });
    if (!invoice) {
      throw new NotFoundException(MSG.INVOICE_NOT_FOUND);
    }

    await this.prisma.invoice.delete({ where: { id: invoice.id } });

    return new ResponseDto(true, 'Invoice deleted successfully');
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async ensureOrderExists(orderId: string): Promise<void> {
    const count = await this.prisma.order.count({ where: { id: orderId } });
    if (count === 0) {
      throw new NotFoundException(MSG.ORDER_NOT_FOUND);
    }
  }

  /**
   * Xizmatlarni tekshiradi, snapshot (serviceName/description) ni oladi
   * va har bir item chegirmasini validatsiya qiladi.
   */
  private async prepareItems(items: InvoiceItemDto[]): Promise<PreparedItem[]> {
    const serviceIds = [...new Set(items.map((i) => i.serviceId))];
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, description: true },
    });
    const serviceMap = new Map(services.map((s) => [s.id, s]));

    return items.map((item, index) => {
      const service = serviceMap.get(item.serviceId);
      if (!service) {
        // Noma'lum xizmat — validatsiya xatoligi (400).
        throw new BadRequestException(
          `items[${index}].serviceId: ${MSG.SERVICE_NOT_FOUND}`,
        );
      }

      const price = Math.round(item.price);
      const subtotal = price * item.quantity;
      this.validateItemDiscount(item, subtotal, index);

      return {
        serviceId: service.id,
        serviceName: service.name,
        serviceDescription: service.description,
        position: index,
        price,
        quantity: item.quantity,
        isPercentDiscount: item.isPercentDiscount,
        discountValue: item.discountValue,
      };
    });
  }

  private validateItemDiscount(
    item: InvoiceItemDto,
    subtotal: number,
    index: number,
  ): void {
    if (item.isPercentDiscount) {
      if (item.discountValue < 0 || item.discountValue > 100) {
        throw new UnprocessableEntityException(
          `items[${index}].discountValue: ${MSG.DISCOUNT_PERCENT_RANGE}`,
        );
      }
    } else if (Math.round(item.discountValue) > subtotal) {
      throw new UnprocessableEntityException(
        `items[${index}].discountValue: ${MSG.DISCOUNT_EXCEEDS_SUBTOTAL}`,
      );
    }
  }

  private validateInvoiceDiscount(
    dto: UpsertInvoiceDto,
    items: PreparedItem[],
  ): void {
    if (dto.isPercentDiscount) {
      if (dto.discountValue < 0 || dto.discountValue > 100) {
        throw new UnprocessableEntityException(MSG.DISCOUNT_PERCENT_RANGE);
      }
      return;
    }

    const itemsTotal = items.reduce(
      (sum, i) => sum + this.itemTotal(i.price, i.quantity, i.isPercentDiscount, i.discountValue),
      0,
    );
    if (Math.round(dto.discountValue) > itemsTotal) {
      throw new UnprocessableEntityException(MSG.DISCOUNT_EXCEEDS_ITEMS_TOTAL);
    }
  }

  /** Bitta item bo'yicha chegirma summasi. */
  private itemDiscountAmount(
    subtotal: number,
    isPercent: boolean,
    discountValue: number,
  ): number {
    const amount = isPercent
      ? Math.round((subtotal * discountValue) / 100)
      : Math.round(discountValue);
    return Math.min(amount, subtotal);
  }

  private itemTotal(
    price: number,
    quantity: number,
    isPercent: boolean,
    discountValue: number,
  ): number {
    const subtotal = price * quantity;
    return subtotal - this.itemDiscountAmount(subtotal, isPercent, discountValue);
  }

  /** Saqlangan invoice dan client kutgan hisoblangan javobni quradi. */
  private build(invoice: {
    id: string;
    orderId: string;
    isPercentDiscount: boolean;
    discountValue: number;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: StoredItem[];
  }) {
    const items = invoice.items.map((item) => {
      const subtotal = item.price * item.quantity;
      const discountAmount = this.itemDiscountAmount(
        subtotal,
        item.isPercentDiscount,
        item.discountValue,
      );
      return {
        id: item.id,
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        serviceDescription: item.serviceDescription,
        price: item.price,
        quantity: item.quantity,
        isPercentDiscount: item.isPercentDiscount,
        discountValue: item.discountValue,
        subtotal,
        discountAmount,
        total: subtotal - discountAmount,
      };
    });

    const itemsTotal = items.reduce((sum, i) => sum + i.total, 0);
    const discountAmount = this.itemDiscountAmount(
      itemsTotal,
      invoice.isPercentDiscount,
      invoice.discountValue,
    );

    return {
      id: invoice.id,
      orderId: invoice.orderId,
      items,
      isPercentDiscount: invoice.isPercentDiscount,
      discountValue: invoice.discountValue,
      comment: invoice.comment,
      summary: {
        itemsTotal,
        discountAmount,
        total: itemsTotal - discountAmount,
      },
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}
