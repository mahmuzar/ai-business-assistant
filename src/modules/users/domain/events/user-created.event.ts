import { DomainEvent } from '@shared/kernel/index.js';

export class UserCreatedEvent extends DomainEvent {
  constructor(public readonly userId: string, public readonly telegramId: number) {
    super();
  }
}