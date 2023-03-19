import * as http from 'http';
import { BaseError } from '../errors';
import { Request, Response, ExtendContext } from './ExtendContext';

export type handler = {
  method: string;
  path: string;
  handlerFunc: (req?: Request, res?: Response) => any | void;
};

export class HttpServer {
  controllers: any[];
  ExtendContext: ExtendContext = new ExtendContext();
  server: http.Server;

  apiPrefix: string;

  constructor(server: http.Server, controllers: any[]) {
    this.controllers = controllers;
    this.server = server;
  }

  public setApiPrefix(prefix: string): void {
    this.apiPrefix = prefix.replace('/', '');
  }

  private getAllHandlersFromControllers(): handler[] {
    const handlers = [];
    for (const controller of this.controllers) {
      const metaKeys = Reflect.getMetadataKeys(controller);
      for (const metaKey of metaKeys) {
        const handler: handler = Reflect.getMetadata(metaKey, controller);
        handler.handlerFunc = handler.handlerFunc.bind(controller);
        handlers.push(handler);
      }
    }
    return handlers;
  }

  private getHandler(
    url: string,
    method: string,
    handlers: handler[]
  ): handler | undefined {
    const splitedUrl: string[] = url.substring(1).split('/');
    for (const handler of handlers) {
      if (method !== handler.method) {
        continue;
      }
      const splitedHandlerPath: string[] = handler.path.substring(1).split('/');
      splitedHandlerPath.unshift(this.apiPrefix);
      //if pattern and url have different lengths
      if (splitedHandlerPath.length !== splitedUrl.length) {
        continue;
      }
      for (let k = 0; k < splitedUrl.length + 1; k++) {
        if (k === splitedUrl.length) {
          return handler;
        }
        if (splitedHandlerPath[k][0] === ':') continue;
        if (splitedHandlerPath[k] !== splitedUrl[k]) break;
      }
    }
  }

  private async executeHandler(
    req: Request, 
    res: Response,
    handler: handler
  ) {
    try {
      const result: any = await handler.handlerFunc(req, res);
      res.end(JSON.stringify(result));
    } catch (e: unknown) {
      if (e instanceof BaseError) {
        res.statusCode = parseInt(e.statusCode);
        res.end(JSON.stringify({ error: e.message }));
      } else {
        res.statusCode = 500;
        console.log(e);
        res.end('Server error');
      }
    }
  }

  private disableCors(res: Response): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With' );
    res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  public run(): void {
    const handlers: handler[] = this.getAllHandlersFromControllers();
    this.server.on('request', async (req: Request, res: Response) => {
      this.disableCors(res);
      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }
      res.setHeader(
        'Content-Type',
        'application/json'
      );
      const handler: handler|undefined = this.getHandler(req.url, req.method, handlers);
      if (!handler) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      await this.ExtendContext.extend(req, res, handler.path);
      await this.executeHandler(req, res, handler);
    });
  }
}