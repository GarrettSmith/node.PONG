"use strict";
var shared = require('../../shared/js/shared');

var WebSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');

var infoPath = "/info";

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server

    // return info page
    if (request.url === infoPath ) {
	    console.log("Info page requested");
    }
    // return main page
    else if (request.url === "/") {
        console.log("Main page requested");
        fs.readFile(__dirname + '/page.html', function(err, data) {
            // if we failed to load the html file
            if (err) {
                response.writeHead(500);
                return response.end('Error loading page.html');
            }
            else {
                response.writeHead(200);
                response.end(data);
            }
        });
    }
    else {
       response.writeHead(404);
       response.end();
    }
});
server.listen(shared.port, function() { });

// create the server
var wsServer = new WebSocketServer({
	httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
		// TODO: recieve message
	});

    connection.on('close', function(connection) {
        // TODO: close user connection
    });
});

console.log("Listening on localhost:" + shared.port);