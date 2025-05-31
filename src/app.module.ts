import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { OrderModule } from './modules/order/order.module';
import { OrderStatusModule } from './modules/order-status/order-status.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/auth.guard';
import { RegionsModule } from './modules/regions/regions.module';
import { SocialModule } from './modules/social/social.module';
import { RoomMeansurementModule } from './modules/room-meansurement/room-meansurement.module';
import { HistoryModule } from './modules/history/history.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { OrderCurrencyModule } from './modules/order-currency/order-currency.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    OrderModule,
    OrderStatusModule,
    RegionsModule,
    SocialModule,
    RoomMeansurementModule,
    HistoryModule,
    StatisticsModule,
    OrderCurrencyModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
