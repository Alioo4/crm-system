import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResponseDto } from 'src/common/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyOrderDto, UpdateOrderCurrencyDto } from './dto';

@Injectable()
export class OrderCurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCurrencyOrderDto) {
    const orderExists = await this.prisma.order.count({
      where: { id: createDto.orederId },
    });

    if (orderExists === 0) {
      throw new NotFoundException(
        new ResponseDto(false, 'Order ID not found!'),
      );
    }

    const created = await this.prisma.currencyOrder.create({
      data: {
        name: createDto.name,
        card: createDto.card ?? 0,
        cash: createDto.cash ?? 0,
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
      throw new BadRequestException(
        new ResponseDto(false, 'CurrencyOrder not found'),
      );
    }

    return new ResponseDto(true, 'CurrencyOrder successfully found', item);
  }

  async update(id: string, updateDto: UpdateOrderCurrencyDto) {
    const exists = await this.prisma.currencyOrder.count({ where: { id } });

    if (exists === 0) {
      throw new NotFoundException(
        new ResponseDto(false, 'CurrencyOrder not found'),
      );
    }

    if (updateDto.orederId) {
      const orderExists = await this.prisma.order.count({
        where: { id: updateDto.orederId },
      });

      if (orderExists === 0) {
        throw new NotFoundException(
          new ResponseDto(false, 'Order ID not found'),
        );
      }
    }

    const updated = await this.prisma.currencyOrder.update({
      where: { id },
      data: {
        name: updateDto.name,
        card: updateDto.card,
        cash: updateDto.cash,
        orederId: updateDto.orederId,
      },
    });

    return new ResponseDto(true, 'CurrencyOrder successfully updated', updated);
  }

  async remove(id: string) {
    const exists = await this.prisma.currencyOrder.count({ where: { id } });

    if (exists === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'CurrencyOrder not found'),
      );
    }

    await this.prisma.currencyOrder.delete({ where: { id } });
    return new ResponseDto(true, 'CurrencyOrder successfully deleted');
  }
}
