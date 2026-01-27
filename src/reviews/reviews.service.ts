import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from '../schemas/review.schema/review.schema';

@Injectable()
export class ReviewsService {
	constructor(@InjectModel(Review.name) private reviewModel: Model<Review>) {}


	async findAll() {
		// Devuelve reviews con user, driver y order populados
		return this.reviewModel.find()
			.populate('user')
			.populate('driver')
			.populate('order');
	}

	async findOne(id: string) {
		// Devuelve review con user, driver y order populados
		return this.reviewModel.findById(id)
			.populate('user')
			.populate('driver')
			.populate('order');
	}


	async create(body: any) {
		// Validación básica de campos obligatorios
		if (!body.user || !body.driver || !body.order || !body.rating) {
			throw new Error('Faltan campos obligatorios');
		}
		if (body.rating < 1 || body.rating > 5) {
			throw new Error('Rating fuera de rango');
		}
		return this.reviewModel.create(body);
	}


	async update(id: string, body: any) {
		// Validación de rating
		if (body.rating && (body.rating < 1 || body.rating > 5)) {
			throw new Error('Rating fuera de rango');
		}
		return this.reviewModel.findByIdAndUpdate(id, body, { new: true });
	}

	async remove(id: string) {
		return this.reviewModel.findByIdAndDelete(id);
	}
}
