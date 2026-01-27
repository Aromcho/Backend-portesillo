import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, Coordinates, DriverLocation } from '../schemas/order.schema/order.schema';
import { TrackingGateway } from './tracking.gateway';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private trackingGateway: TrackingGateway,
  ) {}

  /**
   * Actualizar ubicación del conductor en tiempo real
   */
  async updateDriverLocation(
    orderId: string,
    location: Coordinates,
    heading?: number,
    speed?: number,
  ) {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (!['accepted', 'driver_on_way', 'in_progress'].includes(order.status)) {
      throw new BadRequestException('La orden no está en un estado que permita seguimiento');
    }

    const driverLocation: DriverLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      heading,
      speed,
      timestamp: new Date(),
    };

    order.currentDriverLocation = driverLocation;
    await order.save();

    // Emitir actualización por WebSocket
    this.trackingGateway.server.to(`order-${orderId}`).emit('driver-location', {
      location,
      heading,
      speed,
      timestamp: driverLocation.timestamp,
    });

    // Calcular ETA si es posible
    if (order.pickupCoords && order.deliveryCoords) {
      await this.calculateAndUpdateETA(orderId, location, order);
    }

    return { success: true, location: driverLocation };
  }

  /**
   * Actualizar estado de la orden con timestamp
   */
  async updateOrderStatus(orderId: string, newStatus: string, metadata?: any) {
    const validStatuses = [
      'pending',
      'accepted',
      'driver_on_way',
      'arrived_pickup',
      'in_progress',
      'arrived_delivery',
      'completed',
      'cancelled',
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new BadRequestException(`Estado inválido: ${newStatus}`);
    }

    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Validar transiciones de estado
    this.validateStatusTransition(order.status, newStatus);

    const now = new Date();
    order.status = newStatus;

    // Actualizar timestamps según el estado
    switch (newStatus) {
      case 'accepted':
        order.acceptedAt = now;
        break;
      case 'driver_on_way':
        order.driverOnWayAt = now;
        break;
      case 'arrived_pickup':
        order.arrivedPickupAt = now;
        break;
      case 'in_progress':
        order.inProgressAt = now;
        break;
      case 'arrived_delivery':
        order.arrivedDeliveryAt = now;
        break;
      case 'completed':
        order.completedAt = now;
        break;
      case 'cancelled':
        order.cancelledAt = now;
        if (metadata?.reason) {
          order.cancellationReason = metadata.reason;
        }
        break;
    }

    await order.save();

    // Emitir actualización por WebSocket
    this.trackingGateway.emitOrderStatusUpdate(orderId, newStatus, metadata);

    return order;
  }

  /**
   * Obtener información de tracking de una orden
   */
  async getTrackingInfo(orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('user', 'name phone email')
      .populate('driver', 'name phone vehicleInfo');

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return {
      orderId: order._id,
      status: order.status,
      currentDriverLocation: order.currentDriverLocation,
      pickupCoords: order.pickupCoords,
      deliveryCoords: order.deliveryCoords,
      routeCoords: order.routeCoords,
      distance: order.distance,
      estimatedArrivalMinutes: order.estimatedArrivalMinutes,
      timestamps: {
        createdAt: (order as any).createdAt,
        acceptedAt: order.acceptedAt,
        driverOnWayAt: order.driverOnWayAt,
        arrivedPickupAt: order.arrivedPickupAt,
        inProgressAt: order.inProgressAt,
        arrivedDeliveryAt: order.arrivedDeliveryAt,
        completedAt: order.completedAt,
        cancelledAt: order.cancelledAt,
      },
      user: order.user,
      driver: order.driver,
    };
  }

  /**
   * Notificar llegada del conductor
   */
  async notifyDriverArrival(orderId: string, location: 'pickup' | 'delivery') {
    const newStatus = location === 'pickup' ? 'arrived_pickup' : 'arrived_delivery';
    await this.updateOrderStatus(orderId, newStatus);
    
    this.trackingGateway.emitDriverArrived(orderId, location);

    return { success: true, location };
  }

  /**
   * Calcular y actualizar ETA
   */
  private async calculateAndUpdateETA(
    orderId: string,
    currentLocation: Coordinates,
    order: Order,
  ) {
    // Determinar el destino según el estado
    let targetLocation: Coordinates;
    
    if (order.status === 'accepted' || order.status === 'driver_on_way') {
      targetLocation = order.pickupCoords;
    } else if (order.status === 'in_progress') {
      targetLocation = order.deliveryCoords;
    } else {
      return;
    }

    // Calcular distancia aproximada (fórmula de Haversine simplificada)
    const distance = this.calculateDistance(currentLocation, targetLocation);
    
    // Estimar tiempo (asumiendo 40 km/h promedio en ciudad)
    const estimatedMinutes = Math.round((distance / 40) * 60);

    order.estimatedArrivalMinutes = estimatedMinutes;
    await order.save();

    // Emitir ETA por WebSocket
    this.trackingGateway.emitEstimatedArrival(orderId, estimatedMinutes);
  }

  /**
   * Calcular distancia entre dos puntos (en km)
   */
  private calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.latitude)) *
        Math.cos(this.toRad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validar transiciones de estado
   */
  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: Record<string, string[]> = {
      pending: ['accepted', 'cancelled'],
      accepted: ['driver_on_way', 'cancelled'],
      driver_on_way: ['arrived_pickup', 'cancelled'],
      arrived_pickup: ['in_progress', 'cancelled'],
      in_progress: ['arrived_delivery', 'cancelled'],
      arrived_delivery: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar de ${currentStatus} a ${newStatus}`,
      );
    }
  }

  /**
   * Obtener estadísticas de tracking
   */
  async getTrackingStats() {
    const activeOrders = await this.orderModel.countDocuments({
      status: { $in: ['accepted', 'driver_on_way', 'in_progress'] },
    });

    const activeConnections = this.trackingGateway.getActiveOrdersCount();

    return {
      activeOrders,
      activeConnections,
      timestamp: new Date(),
    };
  }
}
