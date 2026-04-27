import "server-only";

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function assertServiceSuccess(error: unknown, message: string): void {
  if (error) {
    throw new ServiceError(message, error);
  }
}

export function assertServiceData<T>(data: T | null, message: string): asserts data is T {
  if (!data) {
    throw new ServiceError(message);
  }
}
