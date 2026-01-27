import { Injectable, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema/order.schema';
import { CreateOrderDto } from './dto/tracking.dto';
import { TrackingGateway } from './tracking.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@Inject(forwardRef(() => TrackingGateway)) private trackingGateway: TrackingGateway,
		private notificationsService: NotificationsService,
	) {}


	async findAll() {
		// Devuelve pedidos con user, driver, vehicle y reviews populados
			return this.orderModel.find()
				.populate('user', 'name phone email')
				.populate('driver', 'name phone vehicleInfo')
				.sort({ createdAt: -1 });
	}

	async findOne(id: string) {
		// Devuelve pedido con user, driver, vehicle y reviews populados
		const order = await this.orderModel.findById(id)
			.populate('user', 'name phone email')
			.populate('driver', 'name phone vehicleInfo');
		
		return order;
	}

	async findByUser(userId: string) {
		return this.orderModel.find({ user: userId })
			.populate('driver', 'name phone vehicleInfo')
			.sort({ createdAt: -1 });
	}

	async findByDriver(driverId: string) {
		return this.orderModel.find({ driver: driverId })
			.populate('user', 'name phone')
			.sort({ createdAt: -1 });
	}

	async findActiveOrders() {
		return this.orderModel.find({
			status: { $in: ['accepted', 'driver_on_way', 'in_progress'] }
		})
		.populate('user', 'name phone')
		.populate('driver', 'name phone vehicleInfo');
	}

	async create(createOrderDto: CreateOrderDto) {
		// Validación con DTO
		// Soportar tanto formato antiguo como nuevo
		const pickupCoords = createOrderDto.pickupCoords || {
			latitude: createOrderDto.latitude || 0,
			longitude: createOrderDto.longitude || 0,
		};

		const deliveryCoords = createOrderDto.deliveryCoords || {
			latitude: createOrderDto.deliveryLatitude || 0,
			longitude: createOrderDto.deliveryLongitude || 0,
		};

		const order = new this.orderModel({
			user: createOrderDto.user,
			pickupAddress: createOrderDto.pickupAddress,
			deliveryAddress: createOrderDto.deliveryAddress,
			pickupCoords,
			deliveryCoords,
			routeCoords: createOrderDto.routeCoords || [],
			vehicleType: createOrderDto.vehicleType,
			price: createOrderDto.price || 0,
			distance: createOrderDto.distance || 0,
			status: 'pending',
			photos: createOrderDto.photos || [],
			notes: createOrderDto.notes,
			scheduledAt: new Date(),
		});

		const savedOrder = await order.save();
		
		// Notificar al cliente que su orden fue creada
		await this.notificationsService.create({
			user: createOrderDto.user,
			message: 'Tu orden ha sido creada exitosamente. Estamos buscando un conductor disponible.',
			type: 'order_created',
			order: savedOrder._id,
			read: false,
		});
		
		return savedOrder;
	}


	async update(id: string, body: any) {
		const validStatuses = [
			'pending',
			'accepted',
			'driver_on_way',
			'arrived_pickup',
			'in_progress',
			'arrived_delivery',
			'completed',
			'cancelled'
		];

		// Validación de estado
		if (body.status && !validStatuses.includes(body.status)) {
			throw new BadRequestException('Estado inválido');
		}
		
		const updatedOrder = await this.orderModel.findByIdAndUpdate(id, body, { new: true })
			.populate('user', 'name phone email')
			.populate('driver', 'name phone vehicleInfo');

		// Emitir evento WebSocket si cambió el estado
		if (body.status && updatedOrder) {
			this.trackingGateway.emitOrderStatusUpdate(id, body.status, {
				timestamp: new Date(),
			});
			
			// Enviar notificaciones según el estado
			const statusMessages = {
				driver_on_way: 'El conductor va en camino a recoger tu pedido',
				arrived_pickup: 'El conductor ha llegado al punto de recogida',
				in_progress: 'Tu pedido está en camino al destino',
				arrived_delivery: 'El conductor ha llegado al punto de entrega',
				completed: 'Tu pedido ha sido completado exitosamente',
				cancelled: 'Tu pedido ha sido cancelado',
			};
			
			if (statusMessages[body.status] && updatedOrder.user) {
				await this.notificationsService.create({
					user: updatedOrder.user,
					message: statusMessages[body.status],
					type: 'order_status',
					order: id,
					read: false,
				});
			}
		}

		return updatedOrder;
	}

	async assignDriver(orderId: string, driverId: string) {
		const order = await this.orderModel.findById(orderId);
		
		if (!order) {
			throw new BadRequestException('Orden no encontrada');
		}
		
		if (order.status !== 'pending') {
			throw new BadRequestException('Solo se pueden asignar conductores a órdenes pendientes');
		}
		
		order.driver = driverId;
		order.status = 'accepted';
		order.acceptedAt = new Date();
		
		const savedOrder = await order.save();

		// Emitir evento WebSocket de estado actualizado
		this.trackingGateway.emitOrderStatusUpdate(orderId, 'accepted', {
			timestamp: savedOrder.acceptedAt,
			driverId: driverId,
		});
		
		// Notificar al cliente que un conductor aceptó su orden
		await this.notificationsService.create({
			user: order.user,
			message: '¡Un conductor ha aceptado tu orden!',
			type: 'order_accepted',
			order: orderId,
			read: false,
		});
		
		// Notificar al conductor sobre la nueva orden
		await this.notificationsService.create({
			user: driverId,
			message: 'Se te ha asignado una nueva orden',
			type: 'order_assigned',
			order: orderId,
			read: false,
		});

		return savedOrder;
	}

	async remove(id: string) {
		return this.orderModel.findByIdAndDelete(id);
	}

	async migrateCoordinates() {
		// Migrar órdenes que tienen coordenadas en formato plano a formato anidado
		const orders = await this.orderModel.find({
			$or: [
				{ pickupCoords: { $exists: false } },
				{ deliveryCoords: { $exists: false } }
			]
		});

		let migrated = 0;
		let failed = 0;

		for (const order of orders) {
			try {
				const update: any = {};
				
				// Migrar pickupCoords si no existe pero hay latitude/longitude
				if (!order.pickupCoords && (order as any).latitude && (order as any).longitude) {
					update.pickupCoords = {
						latitude: (order as any).latitude,
						longitude: (order as any).longitude,
					};
				}

				// Migrar deliveryCoords si no existe pero hay deliveryLatitude/deliveryLongitude
				if (!order.deliveryCoords && (order as any).deliveryLatitude && (order as any).deliveryLongitude) {
					update.deliveryCoords = {
						latitude: (order as any).deliveryLatitude,
						longitude: (order as any).deliveryLongitude,
					};
				}

				if (Object.keys(update).length > 0) {
					await this.orderModel.findByIdAndUpdate(order._id, update);
					migrated++;
				}
			} catch (err) {
				failed++;
			}
		}

		return {
			success: true,
			message: `Migración completada. ${migrated} órdenes migradas, ${failed} fallidas.`,
			migrated,
			failed,
			total: orders.length,
		};
	}
}
