import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AuthModule } from '../auth/auth.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [AuthModule, HistoryModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
