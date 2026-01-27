import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
	@Prop({ required: true })
	user: string;

	@Prop({ required: true })
	message: string;

	@Prop({ default: false })
	read: boolean;

	@Prop()
	type?: string;

	@Prop()
	order?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
