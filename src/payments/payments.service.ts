import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from '../schemas/payment.schema/payment.schema';

@Injectable()
export class PaymentsService {
	constructor(@InjectModel(Payment.name) private paymentModel: Model<Payment>) {}

	async findAll() {
		return this.paymentModel.find();
	}

	async findOne(id: string) {
		return this.paymentModel.findById(id);
	}

	async create(body: any) {
		return this.paymentModel.create(body);
	}

	async update(id: string, body: any) {
		return this.paymentModel.findByIdAndUpdate(id, body, { new: true });
	}

	async remove(id: string) {
		return this.paymentModel.findByIdAndDelete(id);
	}
}
