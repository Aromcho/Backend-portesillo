import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UpdateUserDto } from './dto/user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
	constructor(private readonly usersService: UsersService) {}


	@Get()
	async findAll() {
		// Devuelve usuarios con datos enriquecidos
		return this.usersService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const user = await this.usersService.findOne(id);
		if (!user) throw new NotFoundException('Usuario no encontrado');
		return user;
	}


	@Put(':id')
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
		try {
			return await this.usersService.update(id, body);
		} catch (error) {
			throw new NotFoundException(error.message);
		}
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return this.usersService.remove(id);
	}
}
