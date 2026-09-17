import { UserCreatedEvent } from '@modules/users/domain/events/user-created.event.js';

describe('UserCreatedEvent', () => {
  it('should store user data', () => {
    const event = new UserCreatedEvent('user-1', 123456);
    expect(event.userId).toBe('user-1');
    expect(event.telegramId).toBe(123456);
    expect(event.eventName).toBe('UserCreatedEvent');
  });
});