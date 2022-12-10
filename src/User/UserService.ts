import { Repository } from 'typeorm';
import { dataSource } from '../db';
import { BadRequestError } from '../errors/BadRequest';
import { UserEntity } from '../Entities/UserEntity';

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
  User: Repository<UserEntity>;
  constructor() {
    this.User = dataSource.getRepository(UserEntity);
  }
  public async createUser({ name, email, password }: UserRegistrationData): Promise<UserEntity> {
    const user = await this.User.findOneBy({ email });
    if (user) throw new BadRequestError('User already exist');
    const newUser = new UserEntity();
    newUser.name = name;
    newUser.email = email;
    newUser.password = password;
    return this.User.save(newUser);
  }
}