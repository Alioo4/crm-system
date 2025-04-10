import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseDto } from 'src/common/types';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createRegionDto: CreateRegionDto) {
    const isExist = await this.prisma.region.count({
      where: { name: createRegionDto.name },
    });

    if (isExist !== 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'This name already exist!!!'),
      );
    }

    const region = await this.prisma.region.create({
      data: { name: createRegionDto.name },
    });
    return new ResponseDto(true, 'Successfully created', region);
  }

  async findAll(name?: string) {
    const regions = await this.prisma.region.findMany({
      where: name ? { name: { contains: name, mode: 'insensitive' } } : {},
      select: {
        id: true,
        name: true,
      },
    });
    return new ResponseDto(true, 'Regions fetched successfully', regions);
  }

  async findOne(id: string) {
    const isExist = await this.prisma.region.findUnique({
      where: { id },
    });

    if (!isExist) {
      throw new BadRequestException(
        new ResponseDto(false, 'This region not found!!!'),
      );
    }

    return new ResponseDto(true, 'Successfully found!!!', isExist);
  }

  async update(id: string, updateRegionDto: UpdateRegionDto) {
    const isExist = await this.prisma.region.count({
      where: { id },
    });

    if (isExist === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'This region not found!!!'),
      );
    }

    await this.prisma.region.update({
      where: { id },
      data: {
        name: updateRegionDto.name,
      },
      select: {
        name: true,
      },
    });

    return new ResponseDto(true, 'Successfullyty updated');
  }

  async remove(id: string) {
    const isExist = await this.prisma.region.count({
      where: { id },
    });

    if (isExist === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'This region not found!!!'),
      );
    }

    const relatedOrders = await this.prisma.order.findMany({
      where: { regionId: id },
      select: {
        id: true,
      },
    });

    for(let i = 0; i < relatedOrders.length; i++) {
      await this.prisma.order.update({
        where: { id: relatedOrders[i].id },
        data: {
          regionId: null,
        },
      });
    }

    await this.prisma.region.delete({ where: { id } });
    return new ResponseDto(true, 'Sucessfullyty deleted');
  }
}
