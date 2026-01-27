import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver } from '../schemas/driver.schema/driver.schema';

@Injectable()
export class DriversService {
	constructor(@InjectModel(Driver.name) private driverModel: Model<Driver>) {}


	async findAll() {
		// Devuelve conductores con reviews y vehicles populados
		return this.driverModel.find().populate('reviews').populate('vehicles');
	}

	async findOne(id: string) {
		// Devuelve conductor con reviews y vehicles populados
		return this.driverModel.findById(id).populate('reviews').populate('vehicles');
	}


	async update(id: string, body: any) {
		// Validación básica de nombre y licencia
		if (body.name && body.name.length < 2) {
			throw new Error('Nombre demasiado corto');
		}
		if (body.license && body.license.length < 5) {
			throw new Error('Licencia inválida');
		}
		return this.driverModel.findByIdAndUpdate(id, body, { new: true });
	}

	async remove(id: string) {
		return this.driverModel.findByIdAndDelete(id);
	}
}
