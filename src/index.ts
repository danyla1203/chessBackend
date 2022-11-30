import * as ws from 'websocket';
import * as http from 'http';
import * as dotenv from 'dotenv';
import { WsServer } from './WsServer';

dotenv.config();

const server = http.createServer(function(req, res) {
  console.log((new Date()) + ' Received request for ' + req.url);
  res.writeHead(200);
  res.end('Http Server');
});
server.listen(process.env.PORT, function() {
  console.log((new Date()) + ` Server is listening on port ${process.env.PORT}`);
});

const wsServer = new ws.server({
  httpServer: server,
});

const Server = new WsServer(wsServer);
Server.run();
