var shared = require('../../shared/js/shared');

var WebSocketServer = require('websocket').server;
var connect = require('connect');
var http = require('http');
var _ = require('underscore');

var game = require('./game').createGame(function(deltaTime) {console.log("tick");});
game.on('start', function(){console.log("Game started");});
game.on('stop', function(){console.log("Game stopped");});

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

// start the game
game.start();

setTimeout(function(){game.stop();}, 5000);

console.log("Game server listening on port " + shared.port);