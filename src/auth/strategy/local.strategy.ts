import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

// 이렇게 하면 컨트롤러에서 오타방지 가능
// @UseGuards(AuthGuard('local')) -> @UseGuards(LocalAuthGuard)
export class LocalAuthGuard extends AuthGuard('Local') {}

@Injectable()
/**
 * PassportStrategy(Strategy, @)
 * @ 부분에 넣는 값으로 AuthGuard 호출 가능
 */
export class LocalStrategy extends PassportStrategy(Strategy, 'Local') {
  constructor(private readonly authService: AuthService) {
    super({
      // Strategy에서 제공해주는 기능임
      // req body값 이렇게 커스텀 가능
      usernameField: 'email',
    });
  }

  /**
   * LocalStrategy
   *
   * validate : username, password
   * return -> Request();
   */
  async validate(email: string, password: string) {
    const user = await this.authService.authenticate(email, password);

    return user;
  }
}
