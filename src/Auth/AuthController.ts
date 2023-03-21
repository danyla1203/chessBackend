import { Auth, AuthService } from '../Auth/AuthService';
import { BadRequestError } from '../errors/BadRequest';
import { Request } from '../lib/ExtendContext';
import { Delete, post, put } from '../lib/httpMethodDecorators';
import { AnonymousUserData } from '../User/UserService';
import { googleOauthSchema, loginSchema, refreshTokenSchema, verifyEmailCodeSchema, verifyEmailSchema } from './Auth.validation';

export class AuthController {
  authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
  }

  @post('/send-verification-mail')
  public async sendVerificationMail({ body }: Request) {
    const { error } = verifyEmailSchema.validate(body);
    if (error) throw new BadRequestError('Incorrect body');
    await this.authService.sendVerificationEmail(body.email);
    return { message: 'ok' };
  }

  @post('/verify-email')
  public async verifyEmailCode({ body }: Request) {
    const { error } = verifyEmailCodeSchema.validate(body);
    if (error) throw new BadRequestError('Incorrect body');
    await this.authService.verifyEmailCode(body.code, body.email);
    return { message: 'ok' };
  }

  @post('/google/oauth')
  public async googleAuthorization({ body }: Request) {
    const { error } = googleOauthSchema.validate(body);
    if (error) throw new BadRequestError('Incorrect body');
    return this.authService.googleOauth(body.code);
  }

  @post('/login')
  public login({ body }: Request): Promise<Auth> {
    const { error } = loginSchema.validate(body);
    if (error) throw new BadRequestError('Incorrect body');
    return this.authService.login(body);
  }
  @put('/refresh-token')
  public getAccessToken({ body }: Request): Promise<Auth> {
    const { error } = refreshTokenSchema.validate(body);
    if (error) throw new BadRequestError('Incorrect body');
    return this.authService.getNewTokenPair(body.refreshToken);
  }
  @Delete('/logout')
  public logout(req: Request): Promise<AnonymousUserData> {
    return this.authService.logout(req.token);
  }
  @Delete('/logout/all')
  public logoutAll(req: Request): Promise<{ isDeleted: boolean }> {
    return this.authService.logoutAll(req.token);
  }
}