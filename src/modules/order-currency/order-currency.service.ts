import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResponseDto } from 'src/common/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyOrderDto, UpdateOrderCurrencyDto } from './dto';
import { MSG } from 'src/common/i18n/messages';

@Injectable()
export class OrderCurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCurrencyOrderDto) {
    const orderExists = await this.prisma.order.count({
      where: { id: createDto.orederId },
    });

    if (orderExists === 0) {
      throw new NotFoundException(MSG.ORDER_NOT_FOUND);
    }

    const created = await this.prisma.currencyOrder.create({
      data: {
        note: createDto.note,
        card: createDto.card,
        cash: createDto.cash,
        isPrePayment: createDto.isPrePayment,
        orederId: createDto.orederId,
      },
    });

    return new ResponseDto(true, 'CurrencyOrder successfully created', created);
  }

  async findAll() {
    const list = await this.prisma.currencyOrder.findMany({
      include: { order: true },
    });
    return new ResponseDto(true, 'CurrencyOrders successfully retrieved', list);
  }

  async findOne(id: string) {
    const item = await this.prisma.currencyOrder.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!item) {
      throw new BadRequestException(MSG.CURRENCY_ORDER_NOT_FOUND);
    }

    return new ResponseDto(true, 'CurrencyOrder successfully found', item);
  }

  async update(id: string, updateDto: UpdateOrderCurrencyDto) {
    const exists = await this.prisma.currencyOrder.count({ where: { id } });

    if (exists === 0) {
      throw new NotFoundException(MSG.CURRENCY_ORDER_NOT_FOUND);
    }

    if (updateDto.orederId) {
      const orderExists = await this.prisma.order.count({
        where: { id: updateDto.orederId },
      });

      if (orderExists === 0) {
        throw new NotFoundException(MSG.ORDER_NOT_FOUND);
      }
    }

    const updated = await this.prisma.currencyOrder.update({
      where: { id },
      data: {
        note: updateDto.note,
        card: updateDto.card,
        cash: updateDto.cash,
        isPrePayment: updateDto.isPrePayment,
        orederId: updateDto.orederId,
      },
    });

    return new ResponseDto(true, 'CurrencyOrder successfully updated', updated);
  }

  async remove(id: string) {
    const exists = await this.prisma.currencyOrder.count({ where: { id } });

    if (exists === 0) {
      throw new BadRequestException(MSG.CURRENCY_ORDER_NOT_FOUND);
    }

    await this.prisma.currencyOrder.delete({ where: { id } });
    return new ResponseDto(true, 'CurrencyOrder successfully deleted');
  }
}
