export class ResponseDto<T, P> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: P;

  constructor(success: boolean, message: string, data?: T, pagination?: P) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.pagination = pagination;
  }
}

export interface IResponse<T = unknown, P = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: P;
}
