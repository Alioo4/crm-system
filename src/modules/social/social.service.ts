import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSocialDto } from './dto/create-social.dto';
import { UpdateSocialDto } from './dto/update-social.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseDto } from 'src/common/types';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSocialDto: CreateSocialDto) {
    const isExist = await this.prisma.social.count({
      where: { name: createSocialDto.name },
    });

    if (isExist !== 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'This name already exist!!!'),
      );
    }

    const social = await this.prisma.social.create({
      data: { name: createSocialDto.name },
    });
    return new ResponseDto(true, 'Sucessfully created', social);
  }

  async findAll(name?: string) {
    const where: any = name
      ? { name: { contains: name, mode: 'insensitive' } }
      : {};
    const data = await this.prisma.social.findMany({
      where,
    });

    return new ResponseDto(true, 'Social fetched successfully', data);
  }

  async findOne(id: string) {
    const isExist = await this.prisma.social.findUnique({
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
    const isExist = await this.prisma.social.count({
      where: { id },
    });

    if (isExist === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'This social not found!!!'),
      );
    }

    await this.prisma.social.update({
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
    const isExist = await this.prisma.social.count({
      where: { id },
    });

    if (isExist === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'This social not found!!!'),
      );
    }

    const relatedOrders = await this.prisma.order.findMany({
      where: { socialId: id },
      select: {
        id: true,
      },
    });

    for(let i = 0; i < relatedOrders.length; i++) {
      await this.prisma.order.update({
        where: { id: relatedOrders[i].id },
        data: { socialId: null },
      });
    }

    await this.prisma.social.delete({ where: { id } });
    return new ResponseDto(true, 'Sucessfullyty deleted');
  }
}
