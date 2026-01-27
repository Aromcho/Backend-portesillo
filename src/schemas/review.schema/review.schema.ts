import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
	@Prop({ required: true })
	user: string;

	@Prop({ required: true })
	driver: string;

	@Prop({ required: true })
	order: string;

	@Prop({ required: true })
	rating: number;

	@Prop()
	comment?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
