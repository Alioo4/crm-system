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

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = Number((page - 1) * limit);

    if (query.startDate) {
      where.updatedAt = {
        ...where.updatedAt,
        gte: new Date(query.startDate),
      };
    }

    if (query.endDate) {
      where.updatedAt = {
        ...where.updatedAt,
        lte: new Date(query.endDate),
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        region: true,
        social: true,
        orderStatus: true,
        roomMeasurement: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
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
    };

    return new ResponseDto(
      true,
      'Successfully found!',
      {
        ...responseData,
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
