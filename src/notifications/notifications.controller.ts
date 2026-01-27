import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Get()
	@ApiOperation({ summary: 'Get all notifications' })
	async findAll() {
		return this.notificationsService.findAll();
	}

	@Get('user/:userId')
	@ApiOperation({ summary: 'Get notifications by user' })
	async findByUser(@Param('userId') userId: string) {
		return this.notificationsService.findByUser(userId);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get notification by ID' })
	async findOne(@Param('id') id: string) {
		const notification = await this.notificationsService.findOne(id);
		if (!notification) throw new NotFoundException('Notificación no encontrada');
		return notification;
	}

	@Post()
	@ApiOperation({ summary: 'Create notification' })
	async create(@Body() body: any) {
		return this.notificationsService.create(body);
	}

	@Put(':id')
	@ApiOperation({ summary: 'Update notification' })
	async update(@Param('id') id: string, @Body() body: any) {
		return this.notificationsService.update(id, body);
	}

	@Put(':id/read')
	@ApiOperation({ summary: 'Mark notification as read' })
	async markAsRead(@Param('id') id: string) {
		return this.notificationsService.markAsRead(id);
	}

	@Put('user/:userId/read-all')
	@ApiOperation({ summary: 'Mark all user notifications as read' })
	async markAllAsRead(@Param('userId') userId: string) {
		return this.notificationsService.markAllAsRead(userId);
	}

	@Post('push-token')
	@ApiOperation({ summary: 'Update push token for user' })
	async updatePushToken(
		@Body('userId') userId: string,
		@Body('pushToken') pushToken: string,
		@Body('userType') userType: 'user' | 'driver' = 'user',
	) {
		return this.notificationsService.updatePushToken(userId, pushToken, userType);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete notification' })
	async remove(@Param('id') id: string) {
		return this.notificationsService.remove(id);
	}
}
