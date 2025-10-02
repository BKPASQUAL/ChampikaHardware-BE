import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/mysql/user.entity';

export interface JwtPayload {
  sub: number; // user_id
  email: string;
  role: string;
  businessId?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { user_id: payload.sub, is_active: true },
      relations: ['business'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user data that will be attached to request.user
    return {
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      businessId: user.businessId,
    };
  }
}