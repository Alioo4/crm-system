import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatisticsQueryDto } from './dto/filter-query.dto';
import { ResponseDto } from 'src/common/types';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role: string, query: StatisticsQueryDto) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Permission denied');
    }

    const where: any = {
      status: 'DONE', 
    };

    if (query.startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(query.startDate),
      };
    }

    if (query.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(query.endDate),
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        total: true,
        prePayment: true,
        dueAmount: true,
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });

    const totalOrders = await this.prisma.order.count({ where });
    const totalAmount = await this.prisma.order.aggregate({
      where,
      _sum: {
        total: true,
        prePayment: true,
        dueAmount: true,
      },
    });

    const responseData = {
      totalSum: totalAmount._sum.total || 0,
      totalPrePayment: totalAmount._sum.prePayment || 0,
      totalDueAmount: totalAmount._sum.dueAmount || 0,
      totalOrders: totalOrders,
    }

    return new ResponseDto(true, 'Successfully found!', responseData)
  }
}