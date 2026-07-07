import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { translate } from '../i18n/messages';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const lang = this.detectLang(request);
    const message = this.extractMessage(exception, lang);

    // Statusni saqlaymiz: BadRequest → 400, NotFound → 404, Conflict → 409,
    // Unprocessable → 422. Invoice contract 404/409/422 ga tayanadi.
    const status = exception.getStatus?.() ?? 400;

    response.status(status).json({ success: false, message });
  }

  private detectLang(request: Request): string {
    const header = request.headers['accept-language'] ?? '';
    
    return header.toLowerCase().startsWith('ru') ? 'uz' : 'uz';
  }

  private extractMessage(exception: HttpException, lang: string): string {
    const body = exception.getResponse();

    // { success: false, message: 'KEY' }  — our ResponseDto pattern
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const msg = (body as any).message;
      // Validation pipe returns array — join them
      if (Array.isArray(msg)) return msg.join(', ');
      return translate(String(msg), lang);
    }

    // Plain string key
    if (typeof body === 'string') return translate(body, lang);

    return translate('PERMISSION_DENIED', lang);
  }
}
