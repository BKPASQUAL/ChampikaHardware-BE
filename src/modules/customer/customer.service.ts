import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/database/mysql/customer.entity';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer-dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    try {
      // Check if contact number already exists
      const existing = await this.customerRepository.findOne({
        where: { contactNumber: dto.contactNumber },
      });

      if (existing) {
        throw new ConflictException(
          'A customer with this contact number already exists',
        );
      }

      // Generate customer code
      const customerCode = await this.generateCustomerCode();

      // Create a new customer instance with auto-generated code
      const customer = this.customerRepository.create({
        ...dto,
        customerCode,
      });

      // Save customer to database
      return await this.customerRepository.save(customer);
    } catch (error) {
      console.error('Error creating customer:', error);

      // Re-throw known exceptions (ConflictException, BadRequestException)
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Handle duplicate customer code error
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new BadRequestException(
          'Customer code already exists. Please try again.',
        );
      }

      throw new InternalServerErrorException('Failed to create customer');
    }
  }

  /**
   * Generate a unique customer code
   * Format: CUST0001, CUST0002, etc.
   */
  private async generateCustomerCode(): Promise<string> {
    const prefix = 'CUST';

    // Find the latest customer code
    const latestCustomer = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.customerCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('customer.customerCode', 'DESC')
      .getOne();

    let sequence = 1;

    if (latestCustomer) {
      // Extract sequence number from the latest customer code
      const lastSequence = latestCustomer.customerCode.substring(4); // Remove 'CUST' prefix
      sequence = parseInt(lastSequence || '0', 10) + 1;
    }

    // Pad sequence with leading zeros (4 digits)
    const sequenceStr = String(sequence).padStart(4, '0');

    return `${prefix}${sequenceStr}`;
  }
}
