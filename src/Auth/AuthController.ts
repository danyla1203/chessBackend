import { Auth, AuthService } from '../Auth/AuthService';
import { BadRequestError } from '../errors/BadRequest';
import { Request } from '../lib/ExtendContext';
import { Delete, post, put } from '../lib/httpMethodDecorators';
import { AnonymousUserData } from '../User/UserService';
import { loginSchema, refreshTokenSchema } from './Auth.validation';

export class AuthController {
  authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
  }

  @post('/login')
  public login({ body }: Request): Promise<Auth> {
    const { error } = loginSchema.validate(body);
    if (error) throw new BadRequestError('Incorrect body');
    return this.authService.login(body);
  }
  @put('/refresh-token')
  public getAccessToken({ body } : Request): Promise<Auth> {
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