import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../schemas/notification.schema/notification.schema';
import { User } from '../schemas/user.schema/user.schema';
import { Driver } from '../schemas/driver.schema/driver.schema';

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name);

	constructor(
		@InjectModel(Notification.name) private notificationModel: Model<Notification>,
		@InjectModel(User.name) private userModel: Model<User>,
		@InjectModel(Driver.name) private driverModel: Model<Driver>,
	) {}

	async findAll() {
		return this.notificationModel.find().sort({ createdAt: -1 });
	}

	async findOne(id: string) {
		return this.notificationModel.findById(id);
	}

	async findByUser(userId: string) {
		return this.notificationModel
			.find({ user: userId })
			.sort({ createdAt: -1 });
	}

	async create(body: any) {
		this.logger.log(`Creating notification for user: ${body.user}`);
		const notification = await this.notificationModel.create(body);
		this.logger.log(`Notification created with ID: ${notification._id}`);
		
		// Enviar push notification
		if (body.user) {
			this.logger.log(`Attempting to send push notification to user: ${body.user}`);
			await this.sendPushNotification(body.user, body.message, body.type, body.order);
		}
		
		return notification;
	}

	async update(id: string, body: any) {
		return this.notificationModel.findByIdAndUpdate(id, body, { new: true });
	}

	async markAsRead(id: string) {
		return this.notificationModel.findByIdAndUpdate(
			id,
			{ read: true },
			{ new: true },
		);
	}

	async markAllAsRead(userId: string) {
		return this.notificationModel.updateMany(
			{ user: userId, read: false },
			{ read: true },
		);
	}

	async remove(id: string) {
		return this.notificationModel.findByIdAndDelete(id);
	}

	async updatePushToken(userId: string, pushToken: string, userType: 'user' | 'driver' = 'user') {
		if (userType === 'driver') {
			return this.driverModel.findByIdAndUpdate(
				userId,
				{ pushToken },
				{ new: true },
			);
		} else {
			return this.userModel.findByIdAndUpdate(
				userId,
				{ pushToken },
				{ new: true },
			);
		}
	}

	private async sendPushNotification(
		userId: string,
		message: string,
		type?: string,
		orderId?: string,
	) {
		try {
			this.logger.log(`Sending push notification to userId: ${userId}`);
			// Buscar el usuario y su push token
			let pushToken: string | undefined;
			const user = await this.userModel.findById(userId);
			
			if (!user) {
				this.logger.log(`User not found, checking drivers...`);
				const driver = await this.driverModel.findById(userId);
				pushToken = driver?.pushToken;
				this.logger.log(`Driver pushToken: ${pushToken}`);
			} else {
				pushToken = user.pushToken;
				this.logger.log(`User pushToken: ${pushToken}`);
			}

			if (!pushToken) {
				this.logger.warn(`No push token found for user ${userId}`);
				return;
			}

			// Validar formato Expo Push Token
			if (!pushToken.startsWith('ExponentPushToken[')) {
				this.logger.warn(`Invalid push token format for user ${userId}: ${pushToken}`);
				return;
			}

			// Preparar el mensaje
			const pushMessage = {
				to: pushToken,
				sound: 'default',
				title: 'Portecillo',
				body: message,
				data: { type, orderId },
			};

			this.logger.log(`Sending push message: ${JSON.stringify(pushMessage)}`);

			// Enviar a Expo Push API
			const response = await fetch('https://exp.host/--/api/v2/push/send', {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(pushMessage),
			});

			const responseData = await response.json();
			this.logger.log(`Expo Push API response: ${JSON.stringify(responseData)}`);

			if (!response.ok) {
				this.logger.error(`Failed to send push notification: ${JSON.stringify(responseData)}`);
			} else {
				this.logger.log(`✅ Push notification sent successfully to user ${userId}`);
			}
		} catch (error) {
			this.logger.error(`Error sending push notification: ${error.message}`);
		}
	}
}
