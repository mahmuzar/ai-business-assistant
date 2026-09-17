import { Result } from '@shared/kernel/index.js';

describe('Result', () => {
  it('should create a success result with a value', () => {
    const result = Result.success('hello');
    expect(result.isSuccess()).toBe(true);
    expect(result.isFailure()).toBe(false);
    expect(result.getValue()).toBe('hello');
  });

  it('should create a failure result with an error message', () => {
    const result = Result.failure('Something went wrong');
    expect(result.isSuccess()).toBe(false);
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('Something went wrong');
  });

  it('should throw when getting value from a failure result', () => {
    const result = Result.failure('Error');
    expect(() => result.getValue()).toThrow();
  });
});