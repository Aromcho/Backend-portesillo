import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
	constructor(private readonly reviewsService: ReviewsService) {}


	@Get()
	async findAll() {
		// Devuelve reviews con datos enriquecidos
		return this.reviewsService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const review = await this.reviewsService.findOne(id);
		if (!review) throw new NotFoundException('Review no encontrada');
		return review;
	}


	@Post()
	async create(@Body() body: any) {
		try {
			return await this.reviewsService.create(body);
		} catch (error) {
			throw new NotFoundException(error.message);
		}
	}


	@Put(':id')
	async update(@Param('id') id: string, @Body() body: any) {
		try {
			return await this.reviewsService.update(id, body);
		} catch (error) {
			throw new NotFoundException(error.message);
		}
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return this.reviewsService.remove(id);
	}
}
