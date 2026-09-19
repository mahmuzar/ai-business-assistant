import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { UpdateDispatcherService } from '../../application/handlers/update-dispatcher.service.js';
import { UpdateDto } from '../../application/dto/update.dto.js';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly dispatcher: UpdateDispatcherService) {}

  @Post('telegram')
  async handleUpdate(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) update: UpdateDto,
  ) {
    await this.dispatcher.dispatch(update);
    return { success: true };
  }
}