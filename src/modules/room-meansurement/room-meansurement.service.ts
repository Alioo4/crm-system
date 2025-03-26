import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoomMeasurementDto } from './dto/create-room-meansurement.dto';
import { UpdateRoomMeansurementDto } from './dto/update-room-meansurement.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseDto } from 'src/common/types';

@Injectable()
export class RoomMeansurementService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createRoomMeansurementDto: CreateRoomMeasurementDto) {
    const isExist = await this.prisma.order.count({
      where: { id: createRoomMeansurementDto.orderId },
    });

    if (isExist === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'Order id not found!!!'),
      );
    }

    const room = await this.prisma.roomMeasurement.create({
      data: {
        name: createRoomMeansurementDto.name,
        key: createRoomMeansurementDto.key,
        value: createRoomMeansurementDto.value,
        orderId: createRoomMeansurementDto.orderId,
      },
    });

    return new ResponseDto(true, 'Successfully created', room);
  }

  async findAll() {
    const rooms = await this.prisma.roomMeasurement.findMany();
    return new ResponseDto(true, 'Successfully find!!!', rooms);
  }

  async findOne(id: string) {
    const isExist = await this.prisma.roomMeasurement.findUnique({
      where: { id },
    });

    if (!isExist) {
      throw new BadRequestException(
        new ResponseDto(false, 'Room not found!!!'),
      );
    }

    return new ResponseDto(true, 'Successfully find!!!', isExist);
  }

  async update(
    id: string,
    updateRoomMeansurementDto: UpdateRoomMeansurementDto,
  ) {
    const isExist = await this.prisma.roomMeasurement.count({
      where: { id },
    });

    if (isExist === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'Room not found!!!'),
      );
    }

    await this.prisma.roomMeasurement.update({
      where: { id },
      data: {
        name: updateRoomMeansurementDto.name,
        key: updateRoomMeansurementDto.key,
        value: updateRoomMeansurementDto.value,
        orderId: updateRoomMeansurementDto.orderId,
      },
    });

    return new ResponseDto(true, 'Successfully updated!!!');
  }

  async remove(id: string) {
    const isExist = await this.prisma.roomMeasurement.count({
      where: { id },
    });

    if (isExist === 0) {
      throw new BadRequestException(
        new ResponseDto(false, 'Room not found!!!'),
      );
    }

    await this.prisma.roomMeasurement.delete({ where: { id } });
    return new ResponseDto(true, 'Successfully deleted!!!');
  }
}
