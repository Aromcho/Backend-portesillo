import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
	@Prop({ required: true, unique: true })
	email: string;

	@Prop({ required: true })
	password: string;

	@Prop({ required: true })
	name: string;

	@Prop()
	phone?: string;

	@Prop()
	avatarUrl?: string;

	@Prop({ default: false })
	emailVerified: boolean;

	@Prop({ default: [] })
	orders: string[];

	@Prop({ default: [] })
	notifications: string[];

	@Prop({ default: [] })
	reviews: string[];

	@Prop()
	pushToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
