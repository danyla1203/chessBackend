import { Auth, AuthService } from '../Auth/AuthService';
import { post, get } from '../lib/httpMethodDecorators';
import { UserService } from './UserService';
import { Request } from '../lib/ExtendContext';
import { createUserSchema } from './User.validation';
import { BadRequestError } from '../errors/BadRequest';
import { UserEntity } from '../Entities/UserEntity';

export class UserController {
  authService: AuthService;
  userService: UserService;
  constructor(userService: UserService, authService: AuthService) {
    this.authService = authService;
    this.userService = userService;
  }

  @post('/signup')
  public async registration(req: Request): Promise<Auth> {
    const { error } = createUserSchema.validate(req.body);
    if (error) throw new BadRequestError('Incorrect body');
    const user: UserEntity = await this.userService.createUser(req.body);
    return await this.authService.createAuth(user.id, req.body.deviceId);
  }
  @get('/me')
  public getUser(req: Request): Promise<UserEntity> {
    return this.authService.checkAccessToken(req.token);
  }
}