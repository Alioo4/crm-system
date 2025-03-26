import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { CreateSocialDto, Social } from './dto/create-social.dto';
import { UpdateSocialDto } from './dto/update-social.dto';
import {
  ApiTags,
  ApiQuery,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Social')
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new social record' })
  @ApiResponse({
    status: 201,
    description: 'Social record successfully created',
    type: Social,
  })
  create(@Body() createSocialDto: CreateSocialDto) {
    return this.socialService.create(createSocialDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all social records' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Search by social name',
    example: 'Twitter',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'A list of social records',
    type: [Social],
  })
  findAll(@Query() query: { name?: string; page?: string; limit?: string }) {
    const { name, page = '1', limit = '10' } = query;
    return this.socialService.findAll(name, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single social record' })
  @ApiResponse({
    status: 200,
    description: 'Social record details',
    type: Social,
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.socialService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a social record' })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated',
    type: Social,
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSocialDto: UpdateSocialDto,
  ) {
    return this.socialService.update(id, updateSocialDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a social record' })
  @ApiResponse({ status: 200, description: 'Successfully deleted' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.socialService.remove(id);
  }
}
