import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get()
	async findAll() {
		return this.chatService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const message = await this.chatService.findOne(id);
		if (!message) throw new NotFoundException('Mensaje no encontrado');
		return message;
	}

	@Post()
	async create(@Body() body: any) {
		return this.chatService.create(body);
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() body: any) {
		return this.chatService.update(id, body);
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return this.chatService.remove(id);
	}
}
