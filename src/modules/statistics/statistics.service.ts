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
      status: query.status ?? 'DONE',
    };
  
    if (query.startDate || query.endDate) {
      where.updatedAt = {};
      if (query.startDate) {
        where.updatedAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.updatedAt.lte = new Date(query.endDate);
      }
    }
  
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;
  
    const [orders, totalOrders, totalAmount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          region: true,
          social: true,
          orderStatus: true,
          roomMeasurement: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: {
          total: true,
          prePayment: true,
          dueAmount: true,
        },
      }),
    ]);
  
    return new ResponseDto(
      true,
      'Successfully found!',
      {
        totalSum: totalAmount._sum.total || 0,
        totalPrePayment: totalAmount._sum.prePayment || 0,
        totalDueAmount: totalAmount._sum.dueAmount || 0,
        totalOrders,
        orders,
      },
      {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
    );
  }
  
}
