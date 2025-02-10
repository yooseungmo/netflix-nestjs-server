import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    // 인터셉터가 실행되는 동안에 req 컨텍스트 안에 qr이 유지됨
    req.queryRunner = qr;

    // handle() 실행되면 컨트롤러 끝날때까지 구독상태로 대기 (컨트롤러 데이터 구독)
    // 컨트롤러에서 반환한 데이터가 Observable 형태로 전달되기 때문에, next.handle()은 그 Observable을 구독(subscribe)
    // Observable로 next.handle()에 전달됨
    return next.handle().pipe(
      catchError(async (e) => {
        await qr.rollbackTransaction();
        await qr.release();
        throw e;
      }),
      tap(async () => {
        await qr.commitTransaction();
        await qr.release();
      }),
    );
  }
}
