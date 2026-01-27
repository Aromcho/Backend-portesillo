import { 
	Controller, 
	Get, 
	Post, 
	Put, 
	Delete, 
	Param, 
	Body, 
	NotFoundException,
	UseGuards,
	Query
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { TrackingService } from './tracking.service';
import { 
	CreateOrderDto, 
	UpdateOrderStatusDto, 
	UpdateLocationDto, 
	NotifyArrivalDto 
} from './dto/tracking.dto';

@Controller('orders')
export class OrdersController {
	constructor(
		private readonly ordersService: OrdersService,
		private readonly trackingService: TrackingService,
	) {}


	@Get()
	async findAll(@Query('userId') userId?: string, @Query('driverId') driverId?: string) {
		if (userId) {
			return this.ordersService.findByUser(userId);
		}
		if (driverId) {
			return this.ordersService.findByDriver(driverId);
		}
		return this.ordersService.findAll();
	}

	@Get('active')
	async findActiveOrders() {
		return this.ordersService.findActiveOrders();
	}

	@Post('migrate-coordinates')
	async migrateCoordinates() {
		// Endpoint temporal para migrar coordenadas de órdenes existentes
		return this.ordersService.migrateCoordinates();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const order = await this.ordersService.findOne(id);
		if (!order) throw new NotFoundException('Pedido no encontrado');
		return order;
	}

	@Get(':id/tracking')
	async getTracking(@Param('id') id: string) {
		return this.trackingService.getTrackingInfo(id);
	}


	@Post()
	async create(@Body() createOrderDto: CreateOrderDto) {
		try {
			const result = await this.ordersService.create(createOrderDto);
			return result;
		} catch (error) {
			throw new NotFoundException(error.message);
		}
	}


	@Put(':id')
	async update(@Param('id') id: string, @Body() body: any) {
		try {
			return await this.ordersService.update(id, body);
		} catch (error) {
			throw new NotFoundException(error.message);
		}
	}

	@Put(':id/status')
	async updateStatus(
		@Param('id') id: string,
		@Body() updateStatusDto: UpdateOrderStatusDto,
	) {
		return this.trackingService.updateOrderStatus(
			id,
			updateStatusDto.status,
			updateStatusDto.metadata,
		);
	}

	@Put(':id/assign-driver')
	async assignDriver(
		@Param('id') id: string,
		@Body('driverId') driverId: string,
	) {
		if (!driverId) {
			throw new NotFoundException('Driver ID es requerido');
		}
		return this.ordersService.assignDriver(id, driverId);
	}

	@Put(':id/location')
	async updateLocation(
		@Param('id') id: string,
		@Body() locationDto: UpdateLocationDto,
	) {
		return this.trackingService.updateDriverLocation(
			id,
			{ latitude: locationDto.latitude, longitude: locationDto.longitude },
			locationDto.heading,
			locationDto.speed,
		);
	}

	@Post(':id/arrival')
	async notifyArrival(
		@Param('id') id: string,
		@Body() arrivalDto: NotifyArrivalDto,
	) {
		return this.trackingService.notifyDriverArrival(id, arrivalDto.location);
	}

	@Get('stats/tracking')
	async getTrackingStats() {
		return this.trackingService.getTrackingStats();
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return this.ordersService.remove(id);
	}
}
