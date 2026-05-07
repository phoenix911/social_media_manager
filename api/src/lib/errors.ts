// Standard JSON error responses. Use throughout routes via `throw new
// HttpError(...)` and the global error handler converts to JSON.

import type { ApiError } from "@smm/shared";

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toJson(): ApiError {
    return { error: { code: this.code, message: this.message, ...(this.details !== undefined ? { details: this.details } : {}) } };
  }
}

export const Unauthorized = (msg = "unauthorized") => new HttpError(401, "unauthorized", msg);
export const Forbidden = (msg = "forbidden") => new HttpError(403, "forbidden", msg);
export const NotFound = (msg = "not found") => new HttpError(404, "not_found", msg);
export const BadRequest = (msg: string, details?: unknown) => new HttpError(400, "bad_request", msg, details);
export const Conflict = (msg: string) => new HttpError(409, "conflict", msg);
export const ServerError = (msg = "server error") => new HttpError(500, "server_error", msg);
