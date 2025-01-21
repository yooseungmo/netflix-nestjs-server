import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const reqTime = Date.now();

    // next.handle() : 컨트롤러 핸들러가 실행되고 결과가 반환된 후, 그 결과를 Observable로 전달함
    return next.handle().pipe(
      /** 강제로 딜레이 걸 수 있음 */
      // delay(1000)
      tap(() => {
        const resTime = Date.now();
        const diff = resTime - reqTime;

        if (diff > 1000) {
          console.log(
            `!!!!!!!!TIMEOUT!!!!!!! [@${req.method} ${req.path}] ${diff}ms`,
          );
        } else {
          console.log(`[@${req.method} ${req.path}] ${diff}ms`);
        }
      }),
    );
  }
}
