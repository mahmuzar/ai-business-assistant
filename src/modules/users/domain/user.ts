import { Entity, Result, DomainEvent } from '@shared/kernel/index.js';
import { Email } from './email.js';
import { UserCreatedEvent } from './events/user-created.event.js';

export interface UserProps {
  id: string;
  telegramId: number;
  email?: Email;
  username?: string;
  status: 'active' | 'banned' | 'deleted';
}

export class User extends Entity<string> {
  private readonly _telegramId: number;
  private readonly _email?: Email;
  private readonly _username?: string;
  private readonly _status: 'active' | 'banned' | 'deleted';
  private readonly _domainEvents: DomainEvent[] = [];

  private constructor(props: UserProps) {
    super(props.id);
    this._telegramId = props.telegramId;
    this._email = props.email;
    this._username = props.username;
    this._status = props.status;
  }

  get telegramId(): number { return this._telegramId; }
  get email(): Email | undefined { return this._email; }
  get username(): string | undefined { return this._username; }
  get status(): string { return this._status; }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  static create(props: UserProps): Result<User> {
    if (!props.telegramId) {
      return Result.failure('Telegram ID is required');
    }

    const user = new User(props);
    user.addDomainEvent(new UserCreatedEvent(props.id, props.telegramId));
    return Result.success(user);
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents.splice(0, this._domainEvents.length);
  }
}