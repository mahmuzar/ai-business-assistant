import { DomainEvent } from '@shared/kernel/index.js';

class UserCreatedEvent extends DomainEvent {
  constructor(public readonly userId: string) {
    super();
  }
}

describe('DomainEvent', () => {
  it('should have a unique id and timestamp', () => {
    const event = new UserCreatedEvent('user-123');
    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.userId).toBe('user-123');
  });

  it('should have the correct event name', () => {
    const event = new UserCreatedEvent('user-123');
    expect(event.eventName).toBe('UserCreatedEvent');
  });
});