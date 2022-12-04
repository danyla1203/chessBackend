import { Auth, AuthService } from '../Auth/AuthService';
import { BadRequestError } from '../errors/BadRequest';
import { Request } from '../lib/ExtendContext';
import { post, put } from '../lib/httpMethodDecorators';
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
  public getAccessToken({ body } : Request) {
    const { error } = refreshTokenSchema.validate(body);
    if (error) throw new BadRequestError('Incorrect body');
    return this.authService.getNewTokenPair(body.refreshToken);
  }
}