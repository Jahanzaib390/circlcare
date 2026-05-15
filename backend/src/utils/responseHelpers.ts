import { Response } from 'express';
import { randomUUID } from 'crypto';

export function success<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
    meta: { requestId: randomUUID(), timestamp: new Date().toISOString() },
  });
}

export function error(res: Response, message: string, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
    meta: { requestId: randomUUID(), timestamp: new Date().toISOString() },
  });
}
