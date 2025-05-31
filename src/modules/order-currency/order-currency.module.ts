import { Module } from '@nestjs/common';
import { OrderCurrencyService } from './order-currency.service';
import { OrderCurrencyController } from './order-currency.controller';

@Module({
  controllers: [OrderCurrencyController],
  providers: [OrderCurrencyService],
})
export class OrderCurrencyModule {}
