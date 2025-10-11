export default class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (errors) {
      this.errors = errors;
    }
  }
}
