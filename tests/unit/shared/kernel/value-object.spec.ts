import { ValueObject } from '@shared/kernel/index.js';

class Email extends ValueObject<{ value: string }> {
    constructor(value: string) {
        super({ value });
    }
}

describe('ValueObject', () => {
    it('should be equal to another VO with the same properties', () => {
        const email1 = new Email('test@example.com');
        const email2 = new Email('test@example.com');
        expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal to a VO with different properties', () => {
        const email1 = new Email('test@example.com');
        const email2 = new Email('other@example.com');
        expect(email1.equals(email2)).toBe(false);
    });
});