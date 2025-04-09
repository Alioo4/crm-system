import { Controller, Get, Query} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { User } from 'src/common/decorators/get-user.decarator';
import { StatisticsQueryDto } from './dto/filter-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiBearerAuth()
  @Get()
  findAll(
    @User() user: {sub: string, role: string},
    @Query() query: StatisticsQueryDto,
  ) {
    return this.statisticsService.findAll(user.role, query);
  }
}
