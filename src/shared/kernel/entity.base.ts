import type { EntityId } from './types.js';

export abstract class Entity<TId extends EntityId = EntityId> {
  protected readonly _id: TId;

  constructor(id: TId) {
    this._id = id;
  }

  get id(): TId {
    return this._id;
  }

  equals(other: Entity<TId>): boolean {
    if (this.constructor !== other.constructor) {
      return false;
    }
    return this._id === other._id;
  }
}