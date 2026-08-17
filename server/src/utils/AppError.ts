export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function assertFound<T>(
  value: T | null | undefined,
  message: string
): asserts value is T {
  if (value == null) {
    throw new AppError(message, 404);
  }
}
