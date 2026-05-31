import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HashtagService } from './hashtag.service';
import { CreateHashtagDto } from './dto/create-hashtag.dto';
import { UpdateHashtagDto } from './dto/update-hashtag.dto';
import { User } from 'src/common/decorators/get-user.decarator';
import { IResponse } from 'src/common/types';

@ApiBearerAuth()
@ApiTags('Hashtags')
@Controller('hashtags')
export class HashtagController {
  constructor(private readonly hashtagService: HashtagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new hashtag (Admin only)' })
  @ApiResponse({ status: 201, description: 'Hashtag created successfully' })
  @ApiResponse({ status: 400, description: 'Hashtag already exists' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  create(
    @Body() dto: CreateHashtagDto,
    @User() user: { role: string },
  ): Promise<IResponse> {
    return this.hashtagService.create(dto, user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hashtags' })
  @ApiResponse({ status: 200, description: 'List of hashtags' })
  findAll(): Promise<IResponse> {
    return this.hashtagService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hashtag by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Hashtag found' })
  @ApiResponse({ status: 400, description: 'Hashtag not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<IResponse> {
    return this.hashtagService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update hashtag (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Hashtag updated successfully' })
  @ApiResponse({ status: 400, description: 'Hashtag not found' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateHashtagDto,
    @User() user: { role: string },
  ): Promise<IResponse> {
    return this.hashtagService.update(id, dto, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete hashtag (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Hashtag deleted successfully' })
  @ApiResponse({ status: 400, description: 'Hashtag not found' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @User() user: { role: string },
  ): Promise<IResponse> {
    return this.hashtagService.remove(id, user.role);
  }
}
