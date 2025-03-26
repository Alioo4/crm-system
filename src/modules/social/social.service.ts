import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSocialDto } from './dto/create-social.dto';
import { UpdateSocialDto } from './dto/update-social.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseDto } from 'src/common/types';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSocialDto: CreateSocialDto) {
    const isExist = await this.prisma.region.count({
      where: { name: createSocialDto.name },
    });

    if (isExist !== 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'This name already exist!!!'),
      );
    }

    const region = await this.prisma.region.create({
      data: { name: createSocialDto.name },
    });
    return new ResponseDto(true, 'Sucessfully created', region);
  }

  async findAll(name?: string, page: number = 1, limit: number = 10) {
    const where: any = name
      ? { name: { contains: name, mode: 'insensitive' } }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.social.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.social.count({ where }),
    ]);

    return new ResponseDto(true, 'Regions fetched successfully', {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  async findOne(id: string) {
    const isExist = await this.prisma.region.findUnique({
      where: { id },
    });

    if (!isExist) {
      throw new BadRequestException(
        new ResponseDto(false, 'This social not found!!!'),
      );
    }

    return new ResponseDto(true, 'Sucessfully found!!!', isExist);
  }

  async update(id: string, updateSocialDto: UpdateSocialDto) {
    const isExist = await this.prisma.region.count({
      where: { id },
    });

    if (isExist === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'This social not found!!!'),
      );
    }

    await this.prisma.region.update({
      where: { id },
      data: {
        name: updateSocialDto.name,
      },
      select: {
        name: true,
      },
    });

    return new ResponseDto(true, 'Sucessfullyty updated');
  }

  async remove(id: string) {
    const isExist = await this.prisma.region.count({
      where: { id },
    });

    if (isExist === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'This social not found!!!'),
      );
    }

    await this.prisma.region.delete({ where: { id } });
    return new ResponseDto(true, 'Sucessfullyty deleted');
  }
}
