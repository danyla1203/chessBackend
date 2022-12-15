import * as ws from 'websocket';
import * as dotenv from 'dotenv';
dotenv.config();
import * as http from 'http';
import { WsServer } from './WsServer';
import { dataSource } from './db';
import { HttpServer } from './lib/HttpServer';
import { AuthController } from './Auth/AuthController';
import { UserController } from './User/UserController';
import { userService, gameService, authService } from './service.modulе';
import { GameController } from './GameAPI/GameController';

dataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
    dataSource.synchronize();
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
const server = http.createServer();

const controllers = [
  new UserController(userService, authService), 
  new AuthController(authService),
  new GameController(gameService, authService)
];
const httpServer: HttpServer = new HttpServer(server, controllers);

server.listen(process.env.PORT, () => {
  console.log((new Date()) + ` Server is listening on port ${process.env.PORT}`);
});

const wsServer = new ws.server({
  httpServer: server,
});

const Server = new WsServer(wsServer, authService);
Server.run();
httpServer.run();