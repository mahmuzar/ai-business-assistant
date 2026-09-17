import { Email } from '@modules/users/index.js';

describe('Email', () => {
    it('should create a valid email', () => {
        const result = Email.create('test@example.com');
        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('test@example.com');
    });

    it('should fail for invalid email format', () => {
        const result = Email.create('not-an-email');
        expect(result.isErr()).toBe(true);
    });

    it('should be equal to another email with the same value', () => {
        const email1 = Email.create('test@example.com').unwrap();
        const email2 = Email.create('test@example.com').unwrap();
        expect(email1.equals(email2)).toBe(true);
    });
});