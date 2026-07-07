import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/get-user.decarator';
import { ManagementService } from './management.service';
import { ManagementOrdersQueryDto } from './dto/management-orders-query.dto';

@ApiTags('Management')
@ApiBearerAuth()
@Controller('management')
export class ManagementController {
  constructor(private readonly managementService: ManagementService) {}

  @Get('orders')
  getOrders(
    @User() user: { sub: string; role: string },
    @Query() query: ManagementOrdersQueryDto,
  ) {
    return this.managementService.getOrders(user.role, query);
  }

  @Get('users')
  getUsers(@User() user: { sub: string; role: string }) {
    return this.managementService.getUsers(user.role);
  }
}
