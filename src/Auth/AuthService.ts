import * as jwt from 'jsonwebtoken';
import { PrismaClient, Game } from '@prisma/client';

import { BadRequestError } from '../errors/BadRequest';
import { NotFound } from '../errors/NotFound';
import { AnonymousUserData } from '../User/UserService';
import { makeId } from '../tools/createUniqueId';

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

export type UserWithoutPassword = {
  id: number
  name: string
  email: string,
  games: Game[]
}

export class AuthService {
  prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }

  private decodeToken(token: string, secret: string): TokenPayload {
    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch (e) {
      throw new BadRequestError('Invalid token');
    }
  }

  public async createAuth(userId: number, deviceId: string): Promise<Auth> {
    const tokenPayload = { deviceId, id: userId };

    const refreshToken = jwt.sign(
      tokenPayload, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );
    const accessToken = jwt.sign(
      tokenPayload, 
      process.env.JWT_ACCESS_SECRET, 
      { expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );
    await this.prisma.auth.create({
      data: {
        refreshToken,
        userId,
        deviceId
      }
    });

    return { access: accessToken, 
      refresh: refreshToken, 
      expiresIn: process.env.JWT_ACCESS_EXPIRES 
    };
  }

  public async checkAccessToken(token?: string): Promise<UserWithoutPassword> {
    if (!token) throw new BadRequestError('Provide token');
    const { id, deviceId } = this.decodeToken(token, process.env.JWT_ACCESS_SECRET);

    const user = await this.prisma.user.findUnique({ 
      where: { id },
      select: { id: true, name: true, email: true, games: true }
    });
    
    if (!user) throw new BadRequestError('Invalid access token');

    const auth = await this.prisma.auth.findFirst({ where: { userId: user.id, deviceId } });
    if (!auth) throw new BadRequestError('Session expired');
    if (auth.expiresIn < new Date()) {
      await this.prisma.auth.delete({ where: auth });
      throw new BadRequestError('Session expired');
    }
    return user;
  }

  public async login({ password, email, deviceId }: LoginData): Promise<Auth> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFound('User not found');
    if (user.password !== password) throw new BadRequestError('Incorrect password');
    await this.prisma.auth.deleteMany({ where: { deviceId } });
    return this.createAuth(user.id, deviceId);
  }
  
  public async logout(token?: string): Promise<AnonymousUserData> {
    const { id, deviceId } = await this.decodeToken(token, process.env.JWT_ACCESS_SECRET);
    await this.prisma.auth.deleteMany({ where: { deviceId, userId: id } });
    return { id: makeId(), name: 'Anonymous' };
  }
  public async logoutAll(token?: string): Promise<{ isDeleted: boolean }> {
    const { id } = await this.decodeToken(token, process.env.JWT_ACCESS_SECRET);
    await this.prisma.auth.deleteMany({ where: { userId: id } });
    return { isDeleted: true };
  }

  public async getNewTokenPair(refreshToken: string): Promise<Auth> {
    const { id } = this.decodeToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    const auth = await this.prisma.auth.findFirst({
      where: {
        refreshToken
      }
    });
    if (!auth) throw new BadRequestError('Session expired');
    if (auth.expiresIn < new Date()) {
      await this.prisma.auth.delete({ where: { id: auth.id } });
      throw new BadRequestError('Session expired');
    }
    await this.prisma.auth.delete({ where: { id: auth.id } });
    return this.createAuth(id, auth.deviceId);
  }
}