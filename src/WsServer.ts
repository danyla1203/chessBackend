import * as ws from 'websocket';
import { AuthService, UserWithoutPassword } from './Auth/AuthService';
import { BaseError } from './errors';
import { ErrorTypes } from './errors/types';
import { GameData } from './Game/Game';
import { GameRequest, GameRouter } from './Game/GameHandler';
import { GameList } from './Game/GameList';
import { makeId } from './tools/createUniqueId';

type Response = {
  type: any,
  payload: any;
}

export enum RequestTypes {
  Game = 'Game',
  GameChat = 'GameChat'
}
export enum ResponseTypes {
  Game = 'Game',
  GameChat = 'GameChat',
  GameList = 'GameList',
  User = 'User',
}

export type ConnectedUser = {
  id: number
  name: string
  conn: ws.connection
  isOnline: boolean
  isAuthorized: boolean
}

export type Request = {
  type?: RequestTypes,
  body?: any
}

export class WsServer {
  ws: ws.server;
  users: ConnectedUser[];
  GameRouter: GameRouter;
  GameList: GameList;
  authService: AuthService;

  constructor(ws: ws.server, authService: AuthService) {
    this.ws = ws;
    this.users = [];
    this.GameList = new GameList((games: GameData[]) => {
      for (const user of this.users) {
        this.sendMessage(user.conn, ResponseTypes.GameList, games);
      }
    }, this.sendMessage);
    this.GameRouter = new GameRouter(this.GameList, this.sendMessage);
    this.authService = authService;
  }

  private sendMessage(
    conn: ws.connection, 
    type: string, 
    payload: any
  ): void {
    const data: Response = { type, payload };
    conn.sendUTF(JSON.stringify(data));
  }

  private isMessageStructValid(parsedMessage: any): boolean {
    if (typeof parsedMessage !== 'object') return false;
    if (!parsedMessage.type) return false;
    if (!parsedMessage.body) return false;
    return true;
  }
  private parseMessage(message: ws.Message): Request|null {
    if (message.type == 'utf8' ) {
      try {
        return JSON.parse(message.utf8Data);
      } catch (e: any) {
        return null;
      }
    }
  }
  
  private handleMessage(user: ConnectedUser, message: Request): void {
    switch (message.type) {
    case RequestTypes.Game:
      this.GameRouter.handleMessage(user, message as GameRequest);
      break;
    }
  }
  private createUser(conn: ws.connection): ConnectedUser {
    return {
      name: 'Anonymous',
      id: makeId(),
      isOnline: true,
      conn,
      isAuthorized: false,
    };
  }
  private async setUser(req: ws.request, conn: ws.connection): Promise<ConnectedUser> {
    let user: ConnectedUser;
    const query = req.resourceURL.query;
    if (typeof query === 'object' && query['Authorization']) {
      const accessToken: string = query['Authorization'] as string;
      try {
        const userEntity: UserWithoutPassword = await this.authService.checkAccessToken(accessToken);
        user = {
          id: userEntity.id,
          name: userEntity.name,
          isOnline: true,
          conn,
          isAuthorized: true
        };
      } catch (e) {
        user = this.createUser(conn);
      }
    } else {
      user = this.createUser(conn);
    }
    return user;
  }

  public run(): void {
    this.ws.on('request', async (req: ws.request) => {
      let newConn: ws.connection;
      try {
        newConn = req.accept('echo-protocol', req.origin);
      } catch (e) {
        return;
      }

      const user: ConnectedUser = await this.setUser(req, newConn);
      this.users.push(user);

      this.sendMessage(newConn, ResponseTypes.User, { id: user.id, name: user.name });
      this.GameList.sendLobbyToConnectedUser(user);
      newConn.on('message', (message: ws.Message) => {
        const parsedMessage: Request|null = this.parseMessage(message);
        if (!parsedMessage || !this.isMessageStructValid(parsedMessage)) {
          this.sendMessage(newConn, ErrorTypes.BAD_REQUEST, 'Message is invalid');
        }
        try {
          this.handleMessage(user, parsedMessage);
        } catch (e: unknown) {
          if (e instanceof BaseError) {
            this.sendMessage(newConn, e.type, { error: e.message, code: e.statusCode });
          } else {
            this.sendMessage(newConn, 'SERVER_ERR', {});
          }
        }
      });
      newConn.on('close', () => {
        this.GameList.removeCreatedGameByUser(user.id);
      });
    });
  }
}
