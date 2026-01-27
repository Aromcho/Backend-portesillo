import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Interfaz para coordenadas
export interface Coordinates {
	latitude: number;
	longitude: number;
}

// Schema para coordenadas
const CoordinatesSchema = {
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
};

// Interfaz para ubicación del conductor en tiempo real
export interface DriverLocation extends Coordinates {
	heading?: number;
	speed?: number;
	timestamp: Date;
}

const DriverLocationSchema = {
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
	heading: { type: Number },
	speed: { type: Number },
	timestamp: { type: Date },
};

@Schema({ timestamps: true })
export class Order extends Document {
	@Prop({ required: true })
	user: string;

	@Prop()
	driver: string;

	@Prop({ required: true })
	pickupAddress: string;

	@Prop({ required: true })
	deliveryAddress: string;

	// Coordenadas de recogida
	@Prop({ type: CoordinatesSchema, required: true })
	pickupCoords: Coordinates;

	// Coordenadas de entrega
	@Prop({ type: CoordinatesSchema, required: true })
	deliveryCoords: Coordinates;

	// Ubicación actual del conductor (en tiempo real)
	@Prop({ type: DriverLocationSchema })
	currentDriverLocation: DriverLocation;

	// Ruta calculada (array de coordenadas)
	@Prop({ type: [CoordinatesSchema], default: [] })
	routeCoords: Coordinates[];

	@Prop({ required: true })
	vehicleType: string;

	@Prop({ required: true })
	price: number;

	// Distancia calculada en kilómetros
	@Prop()
	distance: number;

	// Estados: pending, accepted, driver_on_way, arrived_pickup, in_progress, arrived_delivery, completed, cancelled
	@Prop({ default: 'pending' })
	status: string;

	@Prop({ default: [] })
	photos: string[];

	@Prop({ default: Date.now })
	scheduledAt: Date;

	// Timestamps de cada estado
	@Prop()
	acceptedAt: Date;

	@Prop()
	driverOnWayAt: Date;

	@Prop()
	arrivedPickupAt: Date;

	@Prop()
	inProgressAt: Date;

	@Prop()
	arrivedDeliveryAt: Date;

	@Prop()
	completedAt: Date;

	@Prop()
	cancelledAt: Date;

	// Tiempo estimado de llegada en minutos
	@Prop()
	estimatedArrivalMinutes: number;

	// Notas adicionales
	@Prop()
	notes: string;

	// Razón de cancelación si aplica
	@Prop()
	cancellationReason: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Configurar para que incluya virtuals y sub-documentos correctamente
OrderSchema.set('toJSON', {
	virtuals: true,
	transform: function(doc, ret) {
		// Asegurar que las coordenadas se serialicen correctamente
		if (ret.pickupCoords && (ret.pickupCoords as any)._id) {
			delete (ret.pickupCoords as any)._id;
		}
		if (ret.deliveryCoords && (ret.deliveryCoords as any)._id) {
			delete (ret.deliveryCoords as any)._id;
		}
		if (ret.currentDriverLocation && (ret.currentDriverLocation as any)._id) {
			delete (ret.currentDriverLocation as any)._id;
		}
		if (ret.routeCoords) {
			ret.routeCoords = ret.routeCoords.map((coord: any) => {
				if (coord._id) delete coord._id;
				return coord;
			});
		}
		return ret;
	}
});
