import { Entity } from '@shared/kernel/index.js';

class TestEntity extends Entity<string> {
  constructor(id: string) {
    super(id);
  }
}

describe('Entity', () => {
  it('should return its id', () => {
    const entity = new TestEntity('test-id-1');
    expect(entity.id).toBe('test-id-1');
  });

  it('should be equal to another entity with the same id and type', () => {
    const entity1 = new TestEntity('test-id-1');
    const entity2 = new TestEntity('test-id-1');
    expect(entity1.equals(entity2)).toBe(true);
  });

  it('should not be equal to an entity with a different id', () => {
    const entity1 = new TestEntity('test-id-1');
    const entity2 = new TestEntity('test-id-2');
    expect(entity1.equals(entity2)).toBe(false);
  });
});
