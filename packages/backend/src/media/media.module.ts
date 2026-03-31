import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3Service } from './s3.service';
import { LocalStorageService } from './local-storage.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    S3Service,
    LocalStorageService,
    {
      provide: 'STORAGE_SERVICE',
      useFactory: (
        configService: ConfigService,
        s3Service: S3Service,
        localStorageService: LocalStorageService,
      ) => {
        const useS3 =
          (configService.get('AWS_ACCESS_KEY_ID') &&
            configService.get('AWS_SECRET_ACCESS_KEY')) ||
          configService.get('R2_ENDPOINT');
        return useS3 ? s3Service : localStorageService;
      },
      inject: [ConfigService, S3Service, LocalStorageService],
    },
  ],
  exports: [MediaService, 'STORAGE_SERVICE'],
})
export class MediaModule {}
