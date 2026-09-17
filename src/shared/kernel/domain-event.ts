import { v4 as uuidv4 } from 'uuid';

export abstract class DomainEvent {
  public readonly id: string;
  public readonly timestamp: Date;
  public readonly eventName: string;

  constructor() {
    this.id = uuidv4();
    this.timestamp = new Date();
    this.eventName = this.constructor.name;
  }
}