import * as ws from 'websocket';
import * as http from 'http';
import { WsGameServer } from './WsGameServer';

const server = http.createServer(function(req, res) {
  console.log((new Date()) + ' Received request for ' + req.url);
  res.writeHead(200);
  res.end('Http Server');
});
server.listen(8081, function() {
  console.log((new Date()) + ' Server is listening on port 8080');
});

const wsServer = new ws.server({
  httpServer: server,
});

const Server = new WsGameServer(wsServer);
Server.run();
