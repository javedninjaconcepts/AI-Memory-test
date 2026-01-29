import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UsersService, User } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto): User {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  listUsers(): User[] {
    return this.usersService.listUsers();
  }

  @Get(':id')
  getUser(@Param('id') id: string): User {
    const user = this.usersService.getUser(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string): { message: string } {
    const deleted = this.usersService.deleteUser(id);
    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { message: `User ${id} deleted successfully` };
  }

  @Post(':id/session')
  createSession(@Param('id') userId: string): { sessionId: string } {
    if (!this.usersService.userExists(userId)) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const sessionId = this.usersService.generateSessionId(userId);
    return { sessionId };
  }
}
