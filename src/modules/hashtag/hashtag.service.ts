import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';
import { CreateHashtagDto } from './dto/create-hashtag.dto';
import { UpdateHashtagDto } from './dto/update-hashtag.dto';
import { MSG } from 'src/common/i18n/messages';

@Injectable()
export class HashtagService {
  constructor(private readonly prisma: PrismaService) {}

  private requireAdmin(role: string) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException(MSG.PERMISSION_DENIED);
    }
  }

  async create(dto: CreateHashtagDto, role: string): Promise<IResponse> {
    this.requireAdmin(role);

    const exists = await this.prisma.hashtag.findUnique({
      where: { name: dto.name },
    });
    if (exists) {
      throw new BadRequestException(MSG.HASHTAG_EXISTS);
    }

    const hashtag = await this.prisma.hashtag.create({
      data: { name: dto.name },
    });
    return new ResponseDto(true, 'Hashtag created successfully', hashtag);
  }

  async findAll(): Promise<IResponse> {
    const hashtags = await this.prisma.hashtag.findMany({
      orderBy: { name: 'asc' },
    });
    return new ResponseDto(true, 'Successfully found!', hashtags);
  }

  async findOne(id: string): Promise<IResponse> {
    const hashtag = await this.prisma.hashtag.findUnique({ where: { id } });
    if (!hashtag) {
      throw new BadRequestException(MSG.HASHTAG_NOT_FOUND);
    }
    return new ResponseDto(true, 'Hashtag found', hashtag);
  }

  async update(
    id: string,
    dto: UpdateHashtagDto,
    role: string,
  ): Promise<IResponse> {
    this.requireAdmin(role);

    const hashtag = await this.prisma.hashtag.count({ where: { id } });
    if (!hashtag) {
      throw new BadRequestException(MSG.HASHTAG_NOT_FOUND);
    }

    if (dto.name) {
      const nameConflict = await this.prisma.hashtag.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (nameConflict) {
        throw new BadRequestException(MSG.HASHTAG_NAME_TAKEN);
      }
    }

    const updated = await this.prisma.hashtag.update({
      where: { id },
      data: { name: dto.name },
    });
    return new ResponseDto(true, 'Hashtag updated successfully', updated);
  }

  async remove(id: string, role: string): Promise<IResponse> {
    this.requireAdmin(role);

    const hashtag = await this.prisma.hashtag.count({ where: { id } });
    if (!hashtag) {
      throw new BadRequestException(MSG.HASHTAG_NOT_FOUND);
    }

    await this.prisma.hashtag.delete({ where: { id } });
    return new ResponseDto(true, 'Hashtag deleted successfully');
  }
}
