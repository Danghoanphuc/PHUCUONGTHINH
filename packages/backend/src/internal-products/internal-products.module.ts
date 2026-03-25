import { Module } from '@nestjs/common';
import { InternalProductsController } from './internal-products.controller';
import { InternalProductsService } from './internal-products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InternalProductsController],
  providers: [InternalProductsService],
  exports: [InternalProductsService],
})
export class InternalProductsModule {}
