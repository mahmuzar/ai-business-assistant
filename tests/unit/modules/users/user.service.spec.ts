import { UserServiceImpl } from '@modules/users/application/index.js';
import { FakeUserRepository } from '@modules/users/infrastructure/index.js';

describe('UserService', () => {
  let service: UserServiceImpl;
  let fakeRepo: FakeUserRepository;

  beforeEach(() => {
    fakeRepo = new FakeUserRepository();
    service = new UserServiceImpl(fakeRepo);
  });

  it('should register a new user successfully', async () => {
    const result = await service.registerUser(123456, 'mahmuzar');
    
    expect(result.isOk()).toBe(true);
    const user = result.unwrap();
    expect(user.telegramId).toBe(123456);
  });

  it('should fail if user already exists', async () => {
    await service.registerUser(123456, 'mahmuzar');
    const result = await service.registerUser(123456, 'mahmuzar');
    
    expect(result.isErr()).toBe(true);
  });
});