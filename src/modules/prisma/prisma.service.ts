import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";
import { timezoneOffsetMiddleware } from "src/common/middlewares/prisma.middleware";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>("DATABASE_URL");

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      ...(process.env.NODE_ENV !== "production" && {
        log: [
          { emit: "event", level: "query" },
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "warn" },
        ],
      }),
    });
  }

  async onModuleInit() {
    try {
      this.$use(timezoneOffsetMiddleware);
      this.logger.log("Connecting to database...");
      await this.$connect();
      this.logger.log("Successfully connected to database");
    } catch (error) {
      const err = error as Error; 
      this.logger.error(
        `Failed to connect to database: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log("Disconnecting from database...");
      await this.$disconnect();
      this.logger.log("Successfully disconnected from database");
    } catch (error) {
      const err = error as Error; 
      this.logger.error(
        `Error disconnecting from database: ${err.message}`,
        err.stack,
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      const err = error as Error; 
      this.logger.error(`Database health check failed: ${err.message}`);
      return false;
    }
  }
}
