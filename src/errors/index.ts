export class BaseError extends Error {
  type: string;
  message: string;
  statusCode: string;

  constructor(message: string = null, type: string = null, code: string = null) {
    super();
    this.message = message;
    this.type = type;
    this.statusCode = code;
  }
}

