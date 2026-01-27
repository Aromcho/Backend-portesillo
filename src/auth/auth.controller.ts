import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register-driver')
	async registerDriver(@Body() body: any) {
		try {
			return await this.authService.registerDriver(body);
		} catch (err) {
			throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
		}
	}

	@Post('login-driver')
	async loginDriver(@Body() body: any) {
		try {
			return await this.authService.loginDriver(body);
		} catch (err) {
			throw new HttpException(err.message, HttpStatus.UNAUTHORIZED);
		}
	}

	@Post('register')
	async register(@Body() body: any) {
		try {
			return await this.authService.register(body);
		} catch (err) {
			throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
		}
	}

	@Post('login')
	async login(@Body() body: any) {
		try {
			return await this.authService.login(body);
		} catch (err) {
			throw new HttpException(err.message, HttpStatus.UNAUTHORIZED);
		}
	}

	@Post('send-verification')
	async sendVerification(@Body('email') email: string) {
		return await this.authService.sendVerification(email);
	}

	@Post('verify-email')
	async verifyEmail(@Body() body: any) {
		const { email, code } = body;
		return await this.authService.verifyEmail(email, code);
	}

	@Post('send-reset')
	async sendReset(@Body('email') email: string) {
		return await this.authService.sendReset(email);
	}

	@Post('reset-password')
	async resetPassword(@Body() body: any) {
		const { email, code, password } = body;
		return await this.authService.resetPassword(email, code, password);
	}
}
