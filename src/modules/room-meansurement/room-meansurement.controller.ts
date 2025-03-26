import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoomMeansurementService } from './room-meansurement.service';
import { CreateRoomMeansurementDto } from './dto/create-room-meansurement.dto';
import { UpdateRoomMeansurementDto } from './dto/update-room-meansurement.dto';

@Controller('room-meansurement')
export class RoomMeansurementController {
  constructor(private readonly roomMeansurementService: RoomMeansurementService) {}

  @Post()
  create(@Body() createRoomMeansurementDto: CreateRoomMeansurementDto) {
    return this.roomMeansurementService.create(createRoomMeansurementDto);
  }

  @Get()
  findAll() {
    return this.roomMeansurementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomMeansurementService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomMeansurementDto: UpdateRoomMeansurementDto) {
    return this.roomMeansurementService.update(+id, updateRoomMeansurementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomMeansurementService.remove(+id);
  }
}
