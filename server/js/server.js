"use strict";
var shared = require('../../shared/js/shared');

var WebSocketServer = require('websocket').server;
var http = require('http');
var _ = require('underscore');

var infoPath = "/info";

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server do nothing
});
server.listen(shared.port, function() { });

// create the server
var wsServer = new WebSocketServer({
	httpServer: server
});

var connections = [];

// WebSocket server
wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);
    console.info(request.origin + " connected");
    console.dir(request);
    connections.push(connection);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
		// TODO: recieve message
	});

    connection.on('close', function(connection) {
        // close user connection
        connections.pop(connection);
        console.info(request.origin + " disconnected");
    });
});

function bugger () {
    _.each(connections, function (con) {
        con.sendUTF("Hey!");
    });
}

setInterval(bugger, 1000);

console.log("Listening on localhost:" + shared.port);