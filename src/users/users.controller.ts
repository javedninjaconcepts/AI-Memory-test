import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  async listUsers(): Promise<User[]> {
    return this.usersService.listUsers();
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.getUser(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    const deleted = await this.usersService.deleteUser(id);
    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { message: `User ${id} deleted successfully` };
  }

  @Post(':id/session')
  async createSession(@Param('id') userId: string): Promise<{ sessionId: string }> {
    const exists = await this.usersService.userExists(userId);
    if (!exists) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const sessionId = this.usersService.generateSessionId(userId);
    return { sessionId };
  }
}
