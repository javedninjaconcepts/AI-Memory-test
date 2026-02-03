import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    // Create default user if no users exist
    const count = await this.userRepository.count();
    if (count === 0) {
      await this.createDefaultUser();
    }
  }

  private async createDefaultUser(): Promise<void> {
    const defaultUser = this.userRepository.create({
      name: 'Demo User',
      email: 'demo@example.com',
    });
    const saved = await this.userRepository.save(defaultUser);
    console.log(`✅ Created default demo user (ID: ${saved.id})`);
  }

  /**
   * Create a new user
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
    });
    return this.userRepository.save(user);
  }

  /**
   * Get a user by ID
   */
  async getUser(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  /**
   * Get all users
   */
  async listUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Update a user
   */
  async updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>,
  ): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;

    Object.assign(user, updates);
    return this.userRepository.save(user);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected > 0;
  }

  /**
   * Check if a user exists
   */
  async userExists(id: string): Promise<boolean> {
    const count = await this.userRepository.countBy({ id });
    return count > 0;
  }

  /**
   * Generate a new session ID for a user
   */
  generateSessionId(userId: string): string {
    return `session-${userId}-${uuidv4()}`;
  }
}
