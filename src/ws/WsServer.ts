import { ParsedUrlQuery } from 'querystring';
import * as ws from 'websocket';
import { plainToInstance } from 'class-transformer';
import { AuthService, UserWithoutPassword } from '../Auth/AuthService';
import { BaseError } from '../errors';
import { ErrorTypes } from '../errors/types';
import { validateOrReject, ValidationError } from 'class-validator';
import { NotFound } from '../errors/NotFound';
import {
  SSECaller,
  WSController,
  ConnectedUser,
  ParsedRequest,
} from '.';

export enum ResponseTypes {
  Game = 'Game',
  GameChat = 'GameChat',
  GameList = 'GameList',
  User = 'User',
}

export type Response = {
  type: ResponseTypes;
  payload: any;
};

export class WsServer {
  ws: ws.server;
  users: ConnectedUser[];
  authService: AuthService;

  sseCallers: SSECaller[];
  controllers: WSController[];

  constructor(
    ws: ws.server, 
    authService: AuthService, 
    sseCallers: SSECaller[], 
    controllers: WSController[]
  ) {
    this.ws = ws;
    this.users = [];
    this.authService = authService;

    this.sseCallers = sseCallers;
    this.controllers = controllers;
  }

  private sendMessage(
    user: ConnectedUser,
    type: any,
    payload: any
  ): void {
    const data: Response = { type, payload };
    user.conn.sendUTF(JSON.stringify(data));
  }

  private async parseMessage(message: ws.Message): Promise<ParsedRequest|null> {
    if (message.type == 'utf8' ) {
      try {
        const parsed = JSON.parse(message.utf8Data);
        await validateOrReject(parsed);
        return parsed;
      } catch (e: any) {
        return null;
      }
    }
  }
  private async setUser(req: ws.request, conn: ws.connection): Promise<ConnectedUser> {
    const query = req.resourceURL.query as ParsedUrlQuery;

    if (!query['Authorization']) {
      return new ConnectedUser(conn, false);
    }

    const accessToken: string = query['Authorization'] as string;
    try {
      const { id, name }: UserWithoutPassword = await this.authService.checkAccessToken(accessToken);
      return new ConnectedUser(conn, true, { id, name });
    } catch (e) {
      return new ConnectedUser(conn, false);
    } 
  }

  private getWsHandlers(controllers: WSController[]) {
    const handlers = [];
    for (let controller of controllers) {
      const metaKeys = Reflect.getMetadataKeys(controller);
      for (const metaKey of metaKeys) {
        const handler = Reflect.getMetadata(metaKey, controller);
        handler.handlerFunc = handler.handlerFunc.bind(controller);
        handlers.push(handler);
      }
    }
    return handlers;
  }
  private getHandler(action: string, handlers: any[]) {
    return handlers.find((handler) => handler.action === action);
  }
  private initSseCallers() {
    this.sseCallers.map((sseCaller) => {
      sseCaller.init(this.sendMessage, (type: any, data: any[]) => {
        for (let user of this.users) this.sendMessage(user, type, data);
      });
    });
  }
  private initWsControllers() {
    this.controllers.map((controller) => {
      controller.init(this.sendMessage);
    });
  }
  private callSseOnRequest(user: ConnectedUser) {
    this.sseCallers.map((sseCaller) => {
      this.sendMessage(user, ResponseTypes.User, sseCaller.onRequest(user));
    });
  }

  public run(): void {
    this.initSseCallers();
    this.initWsControllers();
    const handlers: any = this.getWsHandlers(this.controllers);

    this.ws.on('request', async (req: ws.request) => {
      let newConn: ws.connection;
      try {
        newConn = req.accept('echo-protocol', req.origin);
      } catch (e) {
        return;
      }

      const user: ConnectedUser = await this.setUser(req, newConn);
      this.users.push(user);
      this.sendMessage(user, ResponseTypes.User, { id: user.id, name: user.name });
    
      this.callSseOnRequest(user);

      newConn.on('message', async (message: ws.Message) => {
        const parsedMessage: ParsedRequest|null = await this.parseMessage(message);
        if (!parsedMessage) {
          return this.sendMessage(user, ErrorTypes.BAD_REQUEST, 'Message struct is invalid'); 
        }

        const handler = this.getHandler(parsedMessage.action, handlers);
        if (!handler) {
          return this.sendMessage(user, NotFound, 'Ws point not found');
        }

        try {
          const transformedMessage = plainToInstance(handler.validationClass, parsedMessage.body);
          await validateOrReject(transformedMessage);
          handler.handlerFunc(user, transformedMessage);
        } catch (e: any) {
          console.error(e);
          if (e instanceof BaseError) {
            this.sendMessage(user, e.type, { error: e.message, code: e.statusCode });
          } else if (e[0] instanceof ValidationError) {
            this.sendMessage(user, 'BAD_REQUEST', e);
          } else {
            this.sendMessage(user, 'SERVER_ERR', e);
          }
        }
      });
      newConn.on('close', () => {
        this.sseCallers.map((sseCaller) => {
          sseCaller.onCloseConn(user);
        });
      });
    });
  }
}
