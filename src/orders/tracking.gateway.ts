import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('TrackingGateway');
  private activeRooms = new Map<string, Set<string>>(); // orderId -> Set of socketIds

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remover de todas las salas
    this.activeRooms.forEach((sockets, orderId) => {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.activeRooms.delete(orderId);
        }
      }
    });
  }

  @SubscribeMessage('join-order')
  handleJoinOrder(
    @MessageBody() data: { orderId: string; userType: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { orderId, userType } = data;
    
    if (!orderId) {
      return { error: 'Order ID is required' };
    }

    // Unir al cliente a la sala del pedido
    client.join(`order-${orderId}`);
    
    // Registrar en el mapa de salas activas
    if (!this.activeRooms.has(orderId)) {
      this.activeRooms.set(orderId, new Set());
    }
    this.activeRooms.get(orderId)?.add(client.id);

    this.logger.log(`${userType || 'User'} ${client.id} joined order ${orderId}`);
    
    // Notificar a otros en la sala
    client.to(`order-${orderId}`).emit('user-joined', {
      userType,
      timestamp: new Date(),
    });

    return { success: true, orderId };
  }

  @SubscribeMessage('leave-order')
  handleLeaveOrder(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`order-${orderId}`);
    
    const sockets = this.activeRooms.get(orderId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.activeRooms.delete(orderId);
      }
    }

    this.logger.log(`Client ${client.id} left order ${orderId}`);
    return { success: true };
  }

  @SubscribeMessage('driver-location-update')
  handleDriverLocationUpdate(
    @MessageBody() data: {
      orderId: string;
      location: { latitude: number; longitude: number };
      heading?: number;
      speed?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { orderId, location, heading, speed } = data;

    if (!orderId || !location) {
      this.logger.error(`Invalid location update: ${JSON.stringify(data)}`);
      return { success: false, error: 'Invalid data' };
    }

    this.logger.log(`📍 Driver location update for order ${orderId}: ${location.latitude}, ${location.longitude}`);

    // Emitir la ubicación actualizada a todos en la sala (incluyendo el emisor para confirmación)
    this.server.to(`order-${orderId}`).emit('driver-location', {
      location,
      heading,
      speed,
      timestamp: new Date(),
    });

    // También emitir al emisor para confirmación
    client.emit('driver-location', {
      location,
      heading,
      speed,
      timestamp: new Date(),
    });

    this.logger.log(`✅ Location broadcasted to ${this.getOrderConnectionsCount(orderId)} clients`);

    return { success: true };
  }

  @SubscribeMessage('request-driver-location')
  handleRequestDriverLocation(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    // Solicitar al conductor que envíe su ubicación actual
    this.server.to(`order-${orderId}`).emit('location-requested', {
      requestedBy: client.id,
      timestamp: new Date(),
    });

    return { success: true };
  }

  // Métodos para emitir eventos desde el servicio
  emitOrderStatusUpdate(orderId: string, status: string, metadata?: any) {
    this.server.to(`order-${orderId}`).emit('order-status-update', {
      orderId,
      status,
      metadata,
      timestamp: new Date(),
    });
    this.logger.log(`Order ${orderId} status updated to ${status}`);
  }

  emitOrderUpdate(orderId: string, updateData: any) {
    this.server.to(`order-${orderId}`).emit('order-update', {
      orderId,
      ...updateData,
      timestamp: new Date(),
    });
    this.logger.log(`Order ${orderId} updated`);
  }

  emitDriverArrived(orderId: string, location: 'pickup' | 'delivery') {
    this.server.to(`order-${orderId}`).emit('driver-arrived', {
      orderId,
      location,
      timestamp: new Date(),
    });
    this.logger.log(`Driver arrived at ${location} for order ${orderId}`);
  }

  emitEstimatedArrival(orderId: string, estimatedMinutes: number) {
    this.server.to(`order-${orderId}`).emit('estimated-arrival', {
      orderId,
      estimatedMinutes,
      timestamp: new Date(),
    });
    this.logger.log(`ETA updated for order ${orderId}: ${estimatedMinutes} minutes`);
  }

  getActiveOrdersCount(): number {
    return this.activeRooms.size;
  }

  getOrderConnectionsCount(orderId: string): number {
    return this.activeRooms.get(orderId)?.size || 0;
  }
}
