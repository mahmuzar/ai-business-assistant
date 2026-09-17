export class Result<T> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: string;

  private constructor(isSuccess: boolean, value?: T, error?: string) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  static success<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  static failure<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  isSuccess(): boolean {
    return this._isSuccess;
  }

  isFailure(): boolean {
    return !this._isSuccess;
  }

  // Алиасы для удобства (Rust-style)
  isOk(): boolean {
    return this._isSuccess;
  }

  isErr(): boolean {
    return !this._isSuccess;
  }

  getValue(): T {
    if (!this._isSuccess) {
      throw new Error(`Cannot get value from a failed result: ${this._error}`);
    }
    return this._value as T;
  }

  // Алиас для getValue
  unwrap(): T {
    return this.getValue();
  }

  getError(): string | undefined {
    return this._error;
  }
}