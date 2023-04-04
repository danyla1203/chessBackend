import * as ws from 'websocket';
import * as dotenv from 'dotenv';
dotenv.config();
import * as http from 'http';
import { WsServer } from './ws';
import { HttpServer } from './lib/HttpServer';
import { AuthController } from './Auth/AuthController';
import { UserController } from './User/UserController';
import {
  userService, gameService, authService 
} from './service.modulе';
import { GameController } from './GameAPI/GameController';
import { GameList } from './Game/list/GameList';
import { GameRouter } from './Game/router';

const server = http.createServer();

const controllers = [
  new UserController(userService, authService), 
  new AuthController(authService),
  new GameController(gameService, authService)
];
const httpServer: HttpServer = new HttpServer(server, controllers);
httpServer.setApiPrefix('api');

server.listen(process.env.PORT, () => {
  console.log((new Date()) + ` Server is listening on port ${process.env.PORT}`);
});

const wsServer = new ws.server({ httpServer: server, });

const gameList = new GameList();
const wsControllers = [ new GameRouter(gameList) ];

const Server = new WsServer(wsServer, authService, [ gameList ], wsControllers);
Server.run();
httpServer.run();
