import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/get-user.decarator';
import { FinanceService } from './finance.service';
import { FinanceDateRangeDto } from './dto/finance-date-range.dto';
import { PaymentsQueryDto } from './dto/payments-query.dto';
import { HandoverQueryDto } from './dto/handover-query.dto';
import { ConfirmHandoverDto } from './dto/confirm-handover.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getSummary(
    @User() user: { sub: string; role: string },
    @Query() query: FinanceDateRangeDto,
  ) {
    return this.financeService.getSummary(user.role, query);
  }

  @Get('payments')
  getPayments(
    @User() user: { sub: string; role: string },
    @Query() query: PaymentsQueryDto,
  ) {
    return this.financeService.getPayments(user.role, query);
  }

  @Get('debt-orders')
  getDebtOrders(
    @User() user: { sub: string; role: string },
    @Query() query: FinanceDateRangeDto,
  ) {
    return this.financeService.getDebtOrders(user.role, query);
  }

  @Get('handover')
  getHandover(
    @User() user: { sub: string; role: string },
    @Query() query: HandoverQueryDto,
  ) {
    return this.financeService.getHandover(user.role, query);
  }

  @Patch('handover/confirm')
  confirmHandover(
    @User() user: { sub: string; role: string },
    @Body() body: ConfirmHandoverDto,
  ) {
    return this.financeService.confirmHandover(user.sub, body);
  }
}
