import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [LeadsController],
  providers: [LeadsService, NotificationService],
  exports: [LeadsService],
})
export class LeadsModule {}
