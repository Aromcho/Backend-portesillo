import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema/user.schema';

@Injectable()
export class UsersService {
	constructor(@InjectModel(User.name) private userModel: Model<User>) {}


	async findAll() {
		// Devuelve usuarios con reviews y orders populados
		return this.userModel.find().populate('reviews').populate('orders');
	}

	async findOne(id: string) {
		// Devuelve usuario con reviews y orders populados
		return this.userModel.findById(id).populate('reviews').populate('orders');
	}


	async update(id: string, body: any) {
		// Validación básica de email y nombre
		if (body.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
			throw new Error('Email inválido');
		}
		if (body.name && body.name.length < 2) {
			throw new Error('Nombre demasiado corto');
		}
		return this.userModel.findByIdAndUpdate(id, body, { new: true });
	}

	async remove(id: string) {
		return this.userModel.findByIdAndDelete(id);
	}
}
