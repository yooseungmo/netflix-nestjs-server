import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { LocalStrategy } from './strategy/local.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({}), UserModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtAuthGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
