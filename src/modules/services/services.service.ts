import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';
import { MSG } from 'src/common/i18n/messages';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

const SERVICE_SELECT = {
  id: true,
  name: true,
  description: true,
  defaultPrice: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateServiceDto): Promise<IResponse> {
    const service = await this.prisma.service.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        defaultPrice: dto.defaultPrice ?? null,
      },
      select: SERVICE_SELECT,
    });

    return new ResponseDto(true, 'Service created successfully', service);
  }

  async findAll(): Promise<IResponse> {
    const services = await this.prisma.service.findMany({
      select: SERVICE_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return new ResponseDto(true, 'Successfully retrieved all services', services);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<IResponse> {
    await this.ensureExists(id);

    const service = await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.defaultPrice !== undefined && { defaultPrice: dto.defaultPrice }),
      },
      select: SERVICE_SELECT,
    });

    return new ResponseDto(true, 'Service updated successfully', service);
  }

  async remove(id: string): Promise<IResponse> {
    await this.ensureExists(id);

    // Xizmat o'chirilsa, invoice item snapshoti saqlanadi (serviceId → null).
    await this.prisma.service.delete({ where: { id } });

    return new ResponseDto(true, 'Service deleted successfully');
  }

  private async ensureExists(id: string): Promise<void> {
    const count = await this.prisma.service.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(MSG.SERVICE_NOT_FOUND);
    }
  }
}
