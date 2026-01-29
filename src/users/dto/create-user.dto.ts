export class CreateUserDto {
  name: string;
  email?: string;
  metadata?: Record<string, any>;
}
