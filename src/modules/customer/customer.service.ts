import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/database/mysql/customer.entity';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer-dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  async createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if contact number already exists
      const existing = await queryRunner.manager.findOne(Customer, {
        where: { contactNumber: dto.contactNumber },
      });

      if (existing) {
        throw new ConflictException(
          'A customer with this contact number already exists',
        );
      }

      // Generate customer code with retry mechanism
      let customerCode: string;
      let attempts = 0;
      const maxAttempts = 5;

      do {
        customerCode = await this.generateCustomerCode(queryRunner);
        attempts++;

        // Check if this code already exists
        const existingCode = await queryRunner.manager.findOne(Customer, {
          where: { customerCode },
        });

        if (!existingCode) {
          break; // Code is unique, we can use it
        }

        if (attempts >= maxAttempts) {
          throw new InternalServerErrorException(
            'Unable to generate unique customer code after multiple attempts',
          );
        }
      } while (attempts < maxAttempts);

      // Create a new customer instance with auto-generated code
      const customer = queryRunner.manager.create(Customer, {
        ...dto,
        customerCode,
      });

      // Save customer to database within transaction
      const savedCustomer = await queryRunner.manager.save(Customer, customer);

      // Commit the transaction
      await queryRunner.commitTransaction();

      return savedCustomer;
    } catch (error) {
      // Rollback the transaction on error
      await queryRunner.rollbackTransaction();

      console.error('Error creating customer:', error);

      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Handle duplicate entry errors
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        if (error.sqlMessage?.includes('contactNumber')) {
          throw new ConflictException(
            'A customer with this contact number already exists',
          );
        } else if (error.sqlMessage?.includes('customerCode')) {
          throw new BadRequestException(
            'Customer code already exists. Please try again.',
          );
        } else {
          throw new ConflictException(
            'A customer with these details already exists',
          );
        }
      }

      throw new InternalServerErrorException('Failed to create customer');
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  /**
   * Generate a unique customer code with transaction support
   * Format: CUST0001, CUST0002, etc.
   */
  private async generateCustomerCode(
    queryRunner?: QueryRunner,
  ): Promise<string> {
    const prefix = 'CUST';
    const manager = queryRunner
      ? queryRunner.manager
      : this.customerRepository.manager;

    // Use a more robust query to get the highest sequence number
    const result = await manager
      .createQueryBuilder(Customer, 'customer')
      .select(
        'MAX(CAST(SUBSTRING(customer.customerCode, 5) AS UNSIGNED))',
        'maxSequence',
      )
      .where('customer.customerCode REGEXP :pattern', {
        pattern: '^CUST[0-9]+$',
      })
      .getRawOne();

    let sequence = 1;

    if (result && result.maxSequence) {
      sequence = parseInt(result.maxSequence, 10) + 1;
    }

    // Pad sequence with leading zeros (4 digits)
    const sequenceStr = String(sequence).padStart(4, '0');

    return `${prefix}${sequenceStr}`;
  }

  /**
   * Alternative method: Generate customer code using atomic counter
   * This method uses a separate counter table for better concurrency handling
   */
  private async generateCustomerCodeAtomic(): Promise<string> {
    const prefix = 'CUST';

    // This would require a separate counter table
    // For now, using timestamp-based approach as fallback
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');

    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Utility method to check if a customer code exists
   */
  async isCustomerCodeExists(customerCode: string): Promise<boolean> {
    const existing = await this.customerRepository.findOne({
      where: { customerCode },
    });
    return !!existing;
  }

  /**
   * Get all customers
   */
  async findAll(): Promise<Customer[]> {
    try {
      return await this.customerRepository.find({
        relations: ['area', 'assignedRep'],
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new InternalServerErrorException('Failed to fetch customers');
    }
  }

  /**
   * Get customer by ID
   */
  async findOne(id: number): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id },
        relations: ['area', 'assignedRep'],
      });

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }

      return customer;
    } catch (error) {
      console.error('Error fetching customer:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch customer');
    }
  }

  /**
   * Update customer
   */
  async update(id: number, dto: Partial<CreateCustomerDto>): Promise<Customer> {
    try {
      const customer = await this.findOne(id);

      // If contact number is being updated, check for duplicates
      if (dto.contactNumber && dto.contactNumber !== customer.contactNumber) {
        const existing = await this.customerRepository.findOne({
          where: { contactNumber: dto.contactNumber },
        });

        if (existing && existing.id !== id) {
          throw new ConflictException(
            'A customer with this contact number already exists',
          );
        }
      }

      // Update the customer
      Object.assign(customer, dto);
      return await this.customerRepository.save(customer);
    } catch (error) {
      console.error('Error updating customer:', error);

      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update customer');
    }
  }
}
