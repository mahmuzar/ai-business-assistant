import { Injectable } from '@nestjs/common';
import { MessageRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service.js';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

@Injectable()
export class ConversationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findOrCreateActive(userId: string, chatId: number): Promise<string> {
        const existing = await this.prisma.conversation.findFirst({
            where: { userId, chatId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        if (existing) return existing.id;

        const created = await this.prisma.conversation.create({
            data: { userId, chatId },
        });

        return created.id;
    }

    async saveMessage(
        conversationId: string,
        role: MessageRole,
        content: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.prisma.message.create({
            data: {
                conversationId,
                role,
                content,
                metadata: metadata as Prisma.InputJsonValue ?? undefined,
            },
        });
    }

    async getRecentMessages(conversationId: string, limit: number = 10): Promise<ChatMessage[]> {
        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: limit,
            select: { role: true, content: true },
        });

        return messages.map(m => ({
            role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
            content: m.content,
        }));
    }

    async endConversation(conversationId: string): Promise<void> {
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { isActive: false },
        });
    }
}