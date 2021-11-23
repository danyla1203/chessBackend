import * as ws from "websocket";
import * as http from "http";

const server = http.createServer(function(req: any, res: any) {
  console.log((new Date()) + ' Received request for ' + req.url);
  res.writeHead(200);
  res.end("Http Server");
});
server.listen(8082, function() {
  console.log((new Date()) + ' Server is listening on port 8080');
});

const wsServer = new ws.server({
  httpServer: server,
});

wsServer.on('request', function(request: ws.request) {
  const connection = request.accept('echo-protocol', request.origin);
  const URL = request.resourceURL.path;
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message: ws.Message) {
    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      connection.sendUTF(message.utf8Data);
    }
    else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
    });
    connection.on('close', function(reasonCode: any, description: any) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});