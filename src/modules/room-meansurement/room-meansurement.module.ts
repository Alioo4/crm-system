import { Module } from '@nestjs/common';
import { RoomMeansurementService } from './room-meansurement.service';
import { RoomMeansurementController } from './room-meansurement.controller';

@Module({
  controllers: [RoomMeansurementController],
  providers: [RoomMeansurementService],
})
export class RoomMeansurementModule {}
