import { PrismaClient, User } from '@prisma/client';
import { BadRequestError } from '../errors/BadRequest';

export type UserRegistrationData = {
  name: string
  email: string
  password: string
}

export type AnonymousUserData = {
  id: number
  name: 'Anonymous'
}

export class UserService {
  prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }
  public async createUser({ name, email, password }: UserRegistrationData): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) throw new BadRequestError('User already exist');
    return this.prisma.user.create({ data: { name, email, password } });
  }
}