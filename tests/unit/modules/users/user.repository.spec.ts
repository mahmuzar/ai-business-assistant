import type { UserRepository } from '@modules/users/domain/user.repository.js';

describe('UserRepository Interface', () => {
  it('should be defined as a type', () => {
    // Этот тест просто проверяет, что тип существует и экспортируется
    const repo: UserRepository | undefined = undefined;
    expect(repo).toBeUndefined();
  });
});