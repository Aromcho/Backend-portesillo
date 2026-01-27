import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage } from '../schemas/chat-message.schema/chat-message.schema';

@Injectable()
export class ChatService {
	constructor(@InjectModel(ChatMessage.name) private chatModel: Model<ChatMessage>) {}

	async findAll() {
		return this.chatModel.find();
	}

	async findOne(id: string) {
		return this.chatModel.findById(id);
	}

	async create(body: any) {
		return this.chatModel.create(body);
	}

	async update(id: string, body: any) {
		return this.chatModel.findByIdAndUpdate(id, body, { new: true });
	}

	async remove(id: string) {
		return this.chatModel.findByIdAndDelete(id);
	}
}
