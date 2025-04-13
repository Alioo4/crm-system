import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseDto } from 'src/common/types';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createHistoryDto: CreateHistoryDto): Promise<void> {
    await this.prisma.history.create({
      data: createHistoryDto,
    });
  }

  async findAll(
    userStatus: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    regionName?: string,
    socialName?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    const result: any = [];

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { region: { name: { contains: search, mode: 'insensitive' } } },
        { social: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (regionName) {
      where.region = {
        name: { contains: regionName, mode: 'insensitive' },
      };
    }

    if (socialName) {
      where.social = {
        name: { contains: socialName, mode: 'insensitive' },
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (userStatus !== 'ADMIN' && userStatus !== 'MANAGER') {
      where.status = userStatus;
    }

    const histories = await this.prisma.history.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        region: true,
        social: true,
      },
    });

    for (let i = 0; i < histories.length; i++) {
      const order = histories[i];

      const rooms = await this.prisma.roomMeasurement.findMany({
        where: { orderId: order.orderId || undefined },
      });

      const data = { ...order, roomMeasurement: rooms };
      result.push(data);
    }

    const total = await this.prisma.history.count({ where });

    return {
      success: true,
      message: 'Histories fetched successfully',
      data: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const isExist = await this.prisma.history.findUnique({
      where: { id },
      include: { region: true, social: true },
    });

    const rooms = await this.prisma.roomMeasurement.findMany({
      where: { orderId: isExist?.orderId || undefined },
    });
    const data = { ...isExist, roomMeasurement: rooms };

    if (!isExist) {
      throw new NotFoundException(
        new ResponseDto(false, 'This history not found!!!'),
      );
    }

    return new ResponseDto(true, 'Successfully find!!!', data);
  }
}
