import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { StylesModule } from './styles/styles.module';
import { SpacesModule } from './spaces/spaces.module';
import { MediaModule } from './media/media.module';
import { LeadsModule } from './leads/leads.module';
import { ImportModule } from './import/import.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { InternalProductsModule } from './internal-products/internal-products.module';
import { InventoryModule } from './inventory/inventory.module';
import { ContentModule } from './content/content.module';
import configuration, { validate } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    StylesModule,
    SpacesModule,
    MediaModule,
    LeadsModule,
    ImportModule,
    HealthModule,
    InternalProductsModule,
    InventoryModule,
    ContentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
