var shared = require('../../shared/js/shared');

var WebSocketServer = require('websocket').server;
var connect = require('connect');
var http = require('http');
var _ = require('underscore');
var bison = require('bison');
var gameMod = require('./game');

var lastNotify = 0;
var lastFrame = 0;
var notifyRate = 100;

var clientNotifier = function(deltaTime, currentTime, currentFrame) {
    if (currentTime - lastNotify >= notifyRate && connections.length > 0) {
        var notifyDelta = currentTime - lastNotify;
        lastNotify = currentTime;

        var fps = Math.floor((currentFrame - lastFrame) / notifyDelta * 1000);
        lastFrame = currentFrame;

        var state = {
            time: currentTime,
            frame: currentFrame,
            fps: fps
        };
        var message = JSON.stringify(state);//bison.encode(state);
        // console.log(message);
        // send the state to each connection
        _.each(connections, function(conn) {
            conn.send(message);
        });
    }
};

var game = gameMod.createGame(clientNotifier);

game.on('start', function(){console.log("Game started");});
game.on('stop', function(){console.log("Game stopped");});

game.start();

var server = http.createServer().listen(shared.port);

// create the server
var wsServer = new WebSocketServer({
	httpServer: server
});

var connections = [];

// WebSocket server
wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);

    console.info(request.origin + " connected");
    connections.push(connection);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
		// TODO: recieve message
        console.log(message);
	});

    connection.on('close', function(connection) {
        // close user connection
        connections.pop(connection);
        console.info(request.origin + " disconnected");
    });
});

// setTimeout(function(){game.stop();}, 500);

console.log("Game server listening on port " + shared.port);