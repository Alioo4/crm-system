import { PartialType } from '@nestjs/swagger';
import { CreateRoomMeansurementDto } from './create-room-meansurement.dto';

export class UpdateRoomMeansurementDto extends PartialType(CreateRoomMeansurementDto) {}
