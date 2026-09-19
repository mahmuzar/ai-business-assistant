import { Result } from '@shared/kernel/index.js';
import { User } from '../index.js';

export interface UserService {
    registerUser(telegramId: number, username?: string): Promise<Result<User>>;
    
}