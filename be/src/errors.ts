export class PlatformServiceError extends Error {
  _tag = 'PlatformServiceError';

  constructor(message: string) {
    super(message);
    this.name = 'PlatformServiceError';
  }
}

export class PlatformServiceErrorAggregate extends AggregateError {
  _tag = 'PlatformServiceErrorAggregate';

  constructor(errors: PlatformServiceError[], message: string) {
    super(errors, message);
    this.name = 'PlatformServiceErrorAggregate';
  }

  static fromErrors(errors: PlatformServiceError[], message: string) {
    return new PlatformServiceErrorAggregate(errors, message);
  }
}

export function isPlatformServiceErrorAggregate(error: unknown): error is PlatformServiceErrorAggregate {
  // @ts-expect-error we are trying to narrow the type
  return typeof error === 'object' && error?._tag === 'PlatformServiceErrorAggregate';
}
