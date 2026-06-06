import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { User } from 'src/common/decorators/get-user.decarator';

@ApiTags('History')
@ApiBearerAuth()
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Bajarilgan orderlar tarixi (Order tablesidan)' })
  @ApiQuery({ name: 'page',      required: false, type: Number })
  @ApiQuery({ name: 'limit',     required: false, type: Number })
  @ApiQuery({ name: 'search',    required: false, type: String })
  @ApiQuery({ name: 'regionId',  required: false, type: String })
  @ApiQuery({ name: 'socialId',  required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate',   required: false, type: String })
  findAll(
    @User() user: { sub: string; role: string },
    @Query('page')      page?:      number,
    @Query('limit')     limit?:     number,
    @Query('search')    search?:    string,
    @Query('regionId')  regionId?:  string,
    @Query('socialId')  socialId?:  string,
    @Query('startDate') startDate?: string,
    @Query('endDate')   endDate?:   string,
  ) {
    return this.historyService.findAll(
      user.sub,
      user.role,
      page,
      limit,
      search,
      regionId,
      socialId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta bajarilgan orderni ID si bo\'yicha olish' })
  @ApiParam({ name: 'id', type: String, description: 'Order UUID' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @User() user: { sub: string; role: string },
  ) {
    return this.historyService.findOne(id, user.sub, user.role);
  }
}
