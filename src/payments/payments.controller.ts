import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
	constructor(private readonly paymentsService: PaymentsService) {}

	@Get()
	async findAll() {
		return this.paymentsService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const payment = await this.paymentsService.findOne(id);
		if (!payment) throw new NotFoundException('Pago no encontrado');
		return payment;
	}

	@Post()
	async create(@Body() body: any) {
		return this.paymentsService.create(body);
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() body: any) {
		return this.paymentsService.update(id, body);
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return this.paymentsService.remove(id);
	}
}
