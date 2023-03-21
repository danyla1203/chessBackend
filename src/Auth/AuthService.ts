import * as jwt from 'jsonwebtoken';
import * as sgMail from '@sendgrid/mail';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

import { BadRequestError } from '../errors/BadRequest';
import { NotFound } from '../errors/NotFound';
import { AnonymousUserData } from '../User/UserService';
import { makeId } from '../tools/createUniqueId';
import { ConflictError } from '../errors/Conflict';

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
}

interface GoogleOauthToken {
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}
interface GoogleUserResult {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

  public async sendVerificationEmail(email: string): Promise<void> {
    const confirmation = await this.prisma.confirmations.findUnique({
      where: {
        email,
      },
    });
    if (confirmation) throw new ConflictError('Confirmation already exist');

    const code = crypto.randomBytes(16).toString('hex');
    const message = {
      to: email,
      from: 'pifij25684@rolenot.com',
      subject: 'Sending with SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: `<strong>code: ${code} </strong>`,
    };

    await sgMail.send(message);

    await this.prisma.confirmations.create({ data: { email, code } });
  }

  public async verifyEmailCode(code: string, email: string): Promise<void> {
    const confirmation = await this.prisma.confirmations.findUnique({
      where: {
        email,
      },
    });
    if (!confirmation) throw new NotFound('Confirmation not found');
    
    if (confirmation.code !== code) throw new ConflictError('Confirmation code incorrect');

    await this.prisma.confirmations.update({ where: { email }, data: { isConfirmed: true } });
  }

  private async getGoogleToken(code: string): Promise<GoogleOauthToken> {
    const rootURl = 'https://oauth2.googleapis.com/token';
    const options = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT,
      grant_type: 'authorization_code',
    });
    try {
      const result = await fetch(
        `${rootURl}?${options.toString()}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      const data = await result.json();
      return data;
    } catch (err: any) {
      throw new BadRequestError('Something wrong with code');
    }
  };
  private async getGoogleUser(tokenId: string, token: string): Promise<GoogleUserResult> {
    try {
      const url = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`;
      const response = await fetch(
        url,
        {
          headers: {
            Authorization: `Bearer ${tokenId}`,
          },
        },
      );
      const data = await response.json();

      return data;
    } catch (err: any) {
      throw new BadRequestError('Something wrong with code');
    }
  }

  public async googleOauth(code: string) {
    const { id_token, access_token } = await this.getGoogleToken(code);
    const user = await this.getGoogleUser(id_token, access_token);

    // const confirmation = await this.prisma.confirmations.findUnique({ where: { email: user.email } });
    // if (confirmation) throw new ConflictError('User already confirmed');

    // await this.prisma.confirmations.create({ data: {
    //   email: user.email,
    //   code: '',
    //   isConfirmed: true
    // } });

    return { name: user.name, email: user.email };
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
      select: { id: true, name: true, email: true }
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