import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../database/mysql/user.entity';
import { Business } from '../../database/mysql/business.entity';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate business if provided
    if (createUserDto.businessId) {
      const business = await this.businessRepository.findOne({
        where: { business_id: createUserDto.businessId },
      });

      if (!business) {
        throw new BadRequestException('Invalid business ID');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role,
      phone_number: createUserDto.phone_number,
      businessId: createUserDto.businessId,
      is_active: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password, ...result } = savedUser;

    return {
      message: 'User registered successfully',
      user: result,
    };
  }

  /**
   * Login user and return JWT token
   */
  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['business'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      access_token: accessToken,
      token_type: 'Bearer',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        businessId: user.businessId,
        business: user.business,
      },
    };
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId, is_active: true },
      relations: ['business'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['business'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }
}