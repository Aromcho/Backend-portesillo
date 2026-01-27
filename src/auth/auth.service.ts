import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema/user.schema';
import { JwtService } from './jwt/jwt.service';
import { BcryptService } from './bcrypt/bcrypt.service';
import { Driver } from '../schemas/driver.schema/driver.schema';
import { InjectModel as InjectModelDriver } from '@nestjs/mongoose';

@Injectable()
export class AuthService {
	private verificationCodes = new Map<string, string>();
	private resetCodes = new Map<string, string>();

	constructor(
		@InjectModel(User.name) private userModel: Model<User>,
		@InjectModel(Driver.name) private driverModel: Model<Driver>,
		private jwtService: JwtService,
		private bcryptService: BcryptService,
	) {}
	// Registro de conductores
	async registerDriver(body: any) {
		let { email, password, name, phone, vehicle } = body;
		if (!email || !password || !name || !vehicle) {
			throw new BadRequestException('Faltan datos requeridos');
		}
		email = email.toLowerCase();
		const exists = await this.driverModel.findOne({ email });
		if (exists) {
			throw new BadRequestException('El email ya está registrado');
		}
		const hashed = await this.bcryptService.hash(password);
		const driver = await this.driverModel.create({ email, password: hashed, name, phone, vehicle });
		return { driver };
	}

	// Login de conductores
	async loginDriver(body: any) {
		let { email, password } = body;
		if (!email || !password) {
			throw new BadRequestException('Faltan datos');
		}
		email = email.toLowerCase();
		const driver = await this.driverModel.findOne({ email });
		if (!driver) {
			throw new UnauthorizedException('Conductor no encontrado');
		}
		const valid = await this.bcryptService.compare(password, driver.password);
		if (!valid) {
			throw new UnauthorizedException('Contraseña incorrecta');
		}
		const token = await this.jwtService.sign({ sub: driver._id, email: driver.email, role: 'driver' });
		return { token, driver };
	}

	async register(body: any) {
		let { email, password, name, phone } = body;
		if (!email || !password || !name) {
			throw new BadRequestException('Faltan datos requeridos');
		}
		email = email.toLowerCase();
		const exists = await this.userModel.findOne({ email });
		if (exists) {
			throw new BadRequestException('El email ya está registrado');
		}
		const hashed = await this.bcryptService.hash(password);
		const user = await this.userModel.create({ email, password: hashed, name, phone });
		return { user };
	}

	async login(body: any) {
		let { email, password } = body;
		if (!email || !password) {
			throw new BadRequestException('Faltan datos');
		}
		email = email.toLowerCase();
		const user = await this.userModel.findOne({ email });
		if (!user) {
			throw new UnauthorizedException('Usuario no encontrado');
		}
		const valid = await this.bcryptService.compare(password, user.password);
		if (!valid) {
			throw new UnauthorizedException('Contraseña incorrecta');
		}
		const token = await this.jwtService.sign({ sub: user._id, email: user.email });
		return { token, user };
	}

	async sendVerification(email: string) {
		const code = Math.floor(100000 + Math.random() * 900000).toString();
		this.verificationCodes.set(email, code);
		// Aquí deberías enviar el email real
		return { message: `Código de verificación enviado a ${email}`, code };
	}

	async verifyEmail(email: string, code: string) {
		const valid = this.verificationCodes.get(email);
		if (valid && valid === code) {
			await this.userModel.updateOne({ email }, { emailVerified: true });
			this.verificationCodes.delete(email);
			return { message: 'Email verificado' };
		}
		throw new BadRequestException('Código inválido');
	}

	async sendReset(email: string) {
		const user = await this.userModel.findOne({ email });
		if (!user) throw new BadRequestException('Usuario no encontrado');
		const code = Math.floor(100000 + Math.random() * 900000).toString();
		this.resetCodes.set(email, code);
		// Aquí deberías enviar el email real
		return { message: `Código de recuperación enviado a ${email}`, code };
	}

	async resetPassword(email: string, code: string, password: string) {
		const valid = this.resetCodes.get(email);
		if (valid && valid === code) {
			const hashed = await this.bcryptService.hash(password);
			await this.userModel.updateOne({ email }, { password: hashed });
			this.resetCodes.delete(email);
			return { message: 'Contraseña actualizada' };
		}
		throw new BadRequestException('Código inválido');
	}
}
