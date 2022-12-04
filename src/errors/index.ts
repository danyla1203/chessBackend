export class BaseError extends Error {
  type: string;
  message: string;
  statusCode: number;

  constructor(message: string = null, type: string = null, code: number = null) {
    super();
    this.message = message;
    this.type = type;
    this.statusCode = code;
  }
}

