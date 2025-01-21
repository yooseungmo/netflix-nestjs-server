import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const status = 400;

    let message = '데이터베이스 에러 발생!';

    if (exception.message.includes('duplicate key')) {
      message = '중복 키 에러!';
    }

    res.status(status).json({
      statusCode: status,
      timeStamp: new Date().toISOString(),
      path: req.url,
      message,
    });
  }
}
