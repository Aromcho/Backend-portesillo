import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
	constructor(private configService: ConfigService) {}
	
	async sign(payload: any): Promise<string> {
		const secret = this.configService.get<string>('JWT_SECRET') || 'supersecret';
		const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
		return jwt.sign(payload, secret, { expiresIn });
	}
}
