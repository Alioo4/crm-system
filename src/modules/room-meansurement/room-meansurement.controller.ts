import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RoomMeansurementService } from './room-meansurement.service';
import {
  CreateRoomMeasurementDto,
  RoomMeasurement,
} from './dto/create-room-meansurement.dto';
import { UpdateRoomMeansurementDto } from './dto/update-room-meansurement.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Room Measurement')
@Controller('room-meansurement')
export class RoomMeansurementController {
  constructor(
    private readonly roomMeansurementService: RoomMeansurementService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Room Measurement' })
  @ApiResponse({
    status: 201,
    description: 'Successfully created',
    type: RoomMeasurement,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createRoomMeansurementDto: CreateRoomMeasurementDto) {
    return this.roomMeansurementService.create(createRoomMeansurementDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all Room Measurements' })
  @ApiResponse({
    status: 200,
    description: 'Successful operation',
    type: [RoomMeasurement],
  })
  findAll() {
    return this.roomMeansurementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Room Measurement by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successful operation',
    type: RoomMeasurement,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.roomMeansurementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Room Measurement' })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated',
    type: RoomMeasurement,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateRoomMeansurementDto: UpdateRoomMeansurementDto,
  ) {
    return this.roomMeansurementService.update(id, updateRoomMeansurementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Room Measurement' })
  @ApiResponse({ status: 200, description: 'Successfully deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.roomMeansurementService.remove(id);
  }
}
