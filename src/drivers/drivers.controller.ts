import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UpdateDriverDto } from './dto/driver.dto';
import { AuthGuard } from '@nestjs/passport';
import { DriversService } from './drivers.service';

@Controller('drivers')
@UseGuards(AuthGuard('jwt'))
export class DriversController {
	constructor(private readonly driversService: DriversService) {}


	@Get()
	async findAll() {
		// Devuelve conductores con datos enriquecidos
		return this.driversService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const driver = await this.driversService.findOne(id);
		if (!driver) throw new NotFoundException('Conductor no encontrado');
		return driver;
	}


	@Put(':id')
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async update(@Param('id') id: string, @Body() body: UpdateDriverDto) {
		try {
			return await this.driversService.update(id, body);
		} catch (error) {
			throw new NotFoundException(error.message);
		}
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return this.driversService.remove(id);
	}
}
