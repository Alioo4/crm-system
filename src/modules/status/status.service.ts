import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseDto } from 'src/common/types';

@Injectable()
export class StatusService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll() {
    const allStatuses = await this.prisma.status.findMany();
    return new ResponseDto(
      true,
      'Successfully retrieved all statuses',
      allStatuses,
    );
  }

  async findOne(id: string) {
    const status = await this.prisma.status.findUnique({
      where: { id },
    });

    if (!status) {
      throw new BadRequestException('Status not found!');
    }

    return new ResponseDto(true, 'Successfully retrieved status', status);
  }
}
