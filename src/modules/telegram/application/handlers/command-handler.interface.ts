import { UpdateDto } from '../dto/update.dto.js';

export interface CommandHandler {
  // Команда, которую обрабатывает этот хендлер (например, '/start')
  command: string;
  
  // Метод обработки
  handle(update: UpdateDto): Promise<void>;
}