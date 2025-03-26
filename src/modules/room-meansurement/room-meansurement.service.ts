import { Injectable } from '@nestjs/common';
import { CreateRoomMeansurementDto } from './dto/create-room-meansurement.dto';
import { UpdateRoomMeansurementDto } from './dto/update-room-meansurement.dto';

@Injectable()
export class RoomMeansurementService {
  create(createRoomMeansurementDto: CreateRoomMeansurementDto) {
    return 'This action adds a new roomMeansurement';
  }

  findAll() {
    return `This action returns all roomMeansurement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roomMeansurement`;
  }

  update(id: number, updateRoomMeansurementDto: UpdateRoomMeansurementDto) {
    return `This action updates a #${id} roomMeansurement`;
  }

  remove(id: number) {
    return `This action removes a #${id} roomMeansurement`;
  }
}
