import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';

import { dataSource } from '../db';
import { UserEntity } from '../Entities/UserEntity';
import { AuthEntity } from '../Entities/AuthEntity';
import { BadRequestError } from '../errors/BadRequest';
import { NotFound } from '../errors/NotFound';

type TokenPayload = {
  id: number
  deviceId: string
}
export type Auth = {
  access: string
  refresh: string
  expiresIn: string
}

type LoginData = {
  email: string
  password: string
  deviceId: string
}

export class AuthService {
  Auth: Repository<AuthEntity>;
  User: Repository<UserEntity>;
  constructor() {
    this.Auth = dataSource.getRepository(AuthEntity);
    this.User = dataSource.getRepository(UserEntity);
  }
  private decodeToken(token: string, secret: string): TokenPayload {
    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch (e) {
      throw new BadRequestError('Invalid token');
    }
  }

  public async createAuth(userId: number, deviceId: string): Promise<Auth> {
    const auth = new AuthEntity();
    auth.user = userId;
    const tokenPayload = { deviceId, id: userId };
    auth.refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES });
    auth.deviceId = deviceId;
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES });
    await this.Auth.save(auth);
    return { access: accessToken, refresh: auth.refreshToken, expiresIn: process.env.JWT_ACCESS_EXPIRES };
  }

  public async checkAccessToken(token?: string): Promise<UserEntity> {
    if (!token) throw new BadRequestError('Provide token');
    const { id, deviceId } = this.decodeToken(token, process.env.JWT_ACCESS_SECRET);

    const user = await this.User.findOneBy({ id });
    if (!user) throw new BadRequestError('Invalid access token');

    const auth = await this.Auth.findOneBy({ user: user.id, deviceId });
    if (!auth) throw new BadRequestError('Session expired');
    if (auth.expiresIn < new Date()) {
      await this.Auth.delete(auth);
      throw new BadRequestError('Session expired');
    }
    return user;
  }

  public async login({ password, email, deviceId }: LoginData): Promise<Auth> {
    const user = await this.User.findOneBy({ email });
    if (!user) throw new NotFound('User not found');
    if (user.password !== password) throw new BadRequestError('Incorrect password');
    await this.Auth.delete({ deviceId });
    return this.createAuth(user.id, deviceId);
  }
  public async logout(token?: string) {
    const { id, deviceId } = await this.decodeToken(token, process.env.JWT_ACCESS_SECRET);
    await this.Auth.delete({ user: id, deviceId });
    return { isDeleted: true };
  }
  public async logoutAll(token?: string) {
    const { id } = await this.decodeToken(token, process.env.JWT_ACCESS_SECRET);
    await this.Auth.delete({ user: id });
    return { isDeleted: true };
  }

  public async getNewTokenPair(refreshToken: string) {
    const { id } = this.decodeToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    const auth = await this.Auth.findOne({
      relations: {
        user: true,
      },
      where: {
        refreshToken
      }
    });
    if (!auth) throw new BadRequestError('Session expired');
    if (auth.expiresIn < new Date()) {
      this.Auth.delete(auth);
      throw new BadRequestError('Session expired');
    }
    await this.Auth.delete(auth.id);
    return this.createAuth(id, auth.deviceId);
  }
}