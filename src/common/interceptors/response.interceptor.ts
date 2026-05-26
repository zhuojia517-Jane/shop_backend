import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: any) => {
        if (data && typeof data === 'object' && 'code' in data) {
          return data;
        }
        return {
          code: '1',
          msg: '操作成功',
          result: data ?? null,
        };
      }),
    );
  }
}
