import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { Movie } from '../movie/entities/movie.entity';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { DefaultLogger } from './logger/default.logger';
import { TaskService } from './tasks.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        // cwd: current woking directory
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');

          let extension = 'mp4';

          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          cb(null, `${v4()}_${Date.now()}.${extension}`);
        },
      }),
    }),
    TypeOrmModule.forFeature([Movie]),
  ],
  controllers: [CommonController],
  providers: [CommonService, TaskService, DefaultLogger],
  exports: [CommonService, DefaultLogger],
})
export class CommonModule {}
