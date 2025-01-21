import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
} from '@nestjs/common';

@Catch(ForbiddenException)
export class ForbiddenExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const status = exception.getStatus();

    console.log(`[UnauthorizedException] ${req.method} ${req.path}`);

    res.status(status).json({
      statusCode: status,
      timeStamp: new Date().toISOString(),
      path: req.url,
      message: '권한이 없습니다!',
    });
  }
}
