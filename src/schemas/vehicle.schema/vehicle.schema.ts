import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Vehicle extends Document {
	@Prop({ required: true })
	driver: string;

	@Prop({ required: true })
	type: string;

	@Prop({ required: true })
	brand: string;

		@Prop({ required: true })
		vehicleModel: string;

	@Prop({ required: true })
	year: number;

	@Prop({ default: [] })
	photos: string[];

	@Prop()
	description?: string;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
