import axios from 'axios';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data;
    const details = isRecord(response) ? response : undefined;
    const message =
      (typeof details?.message === 'string' && details.message) ||
      (typeof details?.msg === 'string' && details.msg) ||
      error.message ||
      'The request could not be completed.';
    const code =
      (typeof details?.code === 'string' && details.code) || error.code;
    return new ApiError(message, error.response?.status, code);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError(
    'An unexpected error occurred while contacting the server.',
  );
}
