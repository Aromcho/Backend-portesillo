import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle } from '../schemas/vehicle.schema/vehicle.schema';

@Injectable()
export class VehiclesService {
  constructor(@InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>) {}

  async findAll() {
    // Devuelve vehículos con driver y orders populados
    return this.vehicleModel.find().populate('driver').populate('orders');
  }

  async findOne(id: string) {
    // Devuelve vehículo con driver y orders populados
    return this.vehicleModel.findById(id).populate('driver').populate('orders');
  }

  async create(body: any) {
    // Validación básica de campos obligatorios
    if (!body.driver || !body.type || !body.plate) {
      throw new Error('Faltan campos obligatorios');
    }
    return this.vehicleModel.create(body);
  }

  async update(id: string, body: any) {
    // Validación de placa
    if (body.plate && body.plate.length < 5) {
      throw new Error('Placa inválida');
    }
    return this.vehicleModel.findByIdAndUpdate(id, body, { new: true });
  }

  async remove(id: string) {
    return this.vehicleModel.findByIdAndDelete(id);
  }
}
