import { Injectable, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { CreateUserDto } from './dto/create-user.dto';

export interface User {
  id: string;
  name: string;
  email?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface UserFileData {
  id: string;
  name: string;
  email?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class UsersService implements OnModuleInit {
  // In-memory user store backed by JSON file
  private users: Map<string, User> = new Map();
  private readonly filePath: string;

  constructor() {
    // Store users.json in the project root
    this.filePath = path.join(process.cwd(), 'users.json');
  }

  onModuleInit() {
    // Load users from file on startup
    this.loadFromFile();
    
    // Create default user if no users exist
    if (this.users.size === 0) {
      this.createDefaultUser();
    }
  }

  /**
   * Load users from JSON file
   */
  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const usersData: UserFileData[] = JSON.parse(data);
        
        usersData.forEach((userData) => {
          const user: User = {
            ...userData,
            createdAt: new Date(userData.createdAt),
            updatedAt: new Date(userData.updatedAt),
          };
          this.users.set(user.id, user);
        });
        
        console.log(`✅ Loaded ${this.users.size} user(s) from users.json`);
      } else {
        console.log('📁 No users.json found, starting fresh');
      }
    } catch (error) {
      console.error('❌ Error loading users.json:', error.message);
    }
  }

  /**
   * Save users to JSON file
   */
  private saveToFile(): void {
    try {
      const usersArray = Array.from(this.users.values()).map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }));
      
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(usersArray, null, 2),
        'utf-8',
      );
    } catch (error) {
      console.error('❌ Error saving users.json:', error.message);
    }
  }

  private createDefaultUser(): void {
    const defaultUser: User = {
      id: 'user-demo-001',
      name: 'Demo User',
      email: 'demo@example.com',
      metadata: { role: 'demo' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
    this.saveToFile();
  }

  /**
   * Create a new user with a unique ID
   */
  createUser(dto: CreateUserDto): User {
    const user: User = {
      id: `user-${uuidv4()}`,
      name: dto.name,
      email: dto.email,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    this.saveToFile();
    return user;
  }

  /**
   * Get a user by ID
   */
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  /**
   * Get all users
   */
  listUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Update a user
   */
  updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>,
  ): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    this.saveToFile();
    return updatedUser;
  }

  /**
   * Delete a user
   */
  deleteUser(id: string): boolean {
    const result = this.users.delete(id);
    if (result) {
      this.saveToFile();
    }
    return result;
  }

  /**
   * Check if a user exists
   */
  userExists(id: string): boolean {
    return this.users.has(id);
  }

  /**
   * Generate a new session ID for a user
   */
  generateSessionId(userId: string): string {
    return `session-${userId}-${uuidv4()}`;
  }
}
