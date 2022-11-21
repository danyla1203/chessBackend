export class BaseError extends Error {
  type: string;
  message: string;

  constructor(message: string = null, type: string = null) {
    super();
    this.message = message;
    this.type = type;
  }
}

