import { PostBody } from './PostBody';
import * as http from 'http';

type Params = {
  httpOnly?: boolean;
  secure?: boolean;
  domain?: string,
  expires?: string
};

export interface Request extends http.IncomingMessage {
  url: string;
  method: string;
  params: Map<string, any>;
  body: any,
  cookies: Map<string, any>;
  token?: string
}
export interface Response extends http.ServerResponse {
  cookie: (name: string, value: any, params?: Params) => void;
}

export class ExtendContext {
  PostBody: PostBody = new PostBody();

  private setParamsFromUri(url: string, pattern: string, req: Request): void {
    const splitedUrl = url.substring(1).split('/');
    const splitedPattern = pattern.substring(1).split('/');
    req.params = new Map();

    for (let i = 0; i < splitedPattern.length; i++) {
      if (splitedPattern[i][0] == ':') {
        const paramName = splitedPattern[i].substring(1);
        const value = splitedUrl[i].substring(0);
        req.params.set(paramName, value);
      }
    }
  }

  private parseCookie(req: Request): void {
    const cookieString = req.headers['cookie'];
    const parsedCookies = new Map();

    if (!cookieString) {
      req.cookies = parsedCookies;
      return;
    }

    const cookiePairs = cookieString.split(';');
    for (const pair of cookiePairs) {
      const [ name, value ] = pair.split('=');
      parsedCookies.set(name.trim(), value);
    }

    req.cookies = parsedCookies;
  }

  private setCookies(res: Response): void {
    res.cookie = function (name: string, value: any, params?: Params) {
      let cookieString = `${name}=${value}; Path=/; `;
      if (params) {
        params.httpOnly ? cookieString += 'HttpOnly; ' : '';
        params.secure ? cookieString += 'Secure; ' : '';
        params.expires ? cookieString += `Expires=${params.expires}; `: '';
        params.domain ? cookieString += `Domain=${params.domain}; ` : '';
      }
      this.setHeader('Set-Cookie', [ cookieString ]);
    };
  }
  private setToken(req: Request): void {
    const header = req.headers['authorization'];
    if (header) req.token = header.split(' ')[1];
  }

  public async extend(req: Request, res: Response, pattern: string) {
    await this.setParamsFromUri(req.url, pattern, req);
    await this.parseCookie(req);
    await this.setCookies(res);
    await this.PostBody.handle(req);
    this.setToken(req);
  }
}