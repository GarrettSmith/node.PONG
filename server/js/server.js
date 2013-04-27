var shared = require('../../shared/js/shared');

var WebSocketServer = require('websocket').server;
var http = require('http');
var _ = require('underscore');
//var bison = require('bison');
var repl = require('repl');
var net = require('net');
var static = require('node-static');

var game;

function startGame() {
    game = require('./pong').createGame();

    var lastNotify = 0;
    var lastFrame = 0;
    var notifyRate = 60;

    // notify clients of the current state
    var clientNotifier = function(deltaTime, currentTime, currentFrame) {
        // if the notify rate has elapsed and there is atleast one client connected
        if (currentTime - lastNotify >= notifyRate && connections.length > 0) {
            // hos long it's been since the last notify
            var notifyDelta = currentTime - lastNotify;
            lastNotify = currentTime;

            // calculate fps
            // TODO: Improve this to smooth things some
            var fps = Math.floor((currentFrame - lastFrame) / notifyDelta * 1000);
            lastFrame = currentFrame;

            // package up the state
            var state = {
                time: currentTime,
                frame: currentFrame,
                fps: fps,
                ball: game.ball,
                leftPaddle: game.leftPaddle,
                rightPaddle: game.rightPaddle,
                scores: game.scores,
                input: game.input
            };

            // encode the message
            var message = JSON.stringify(state); //bison.encode(state); //
            // console.log(message);

            // send the state to each connection
            _.each(connections, function(conn) {
                conn.send(message);
            });
        }
    };

    game.on('tick', clientNotifier);

    game.start();
}

var restart = function() {
    // stop the current game
    game.stop();
    // clear the require cache so changes in files are reflected
    Object.keys(require.cache).forEach(function(key) {
        delete require.cache[key];
    });
    // start a new game
    startGame();
};

startGame();

var file = new(static.Server)('../../client');

var webServer = http.createServer(function(request, response) {
    file.serve(request, response);
}).listen(shared.http_port);

var socketServer = http.createServer().listen(shared.socket_port);

// create the server
var wsServer = new WebSocketServer({
	httpServer: socketServer
});

var connections = [];

// WebSocket server
wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);

    // console.info(request.origin + " connected");
    connections.push(connection);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
		// recieve message
        message = JSON.parse(message.utf8Data);
        handleMessage(message, connection);
	});

    connection.on('close', function(connection) {
        // close user connection
        connections.pop(connection);
        // console.info(request.origin + " disconnected");
    });
});

function handleMessage(message, connection) {
    switch(message.type) {
        case 'input':
            handleInput(message, connection);
            break;
        case 'join':
            handleJoin(message, connection);
            break;
    }
}

function handleJoin(message, connection) {
    connection.team = message.team;
}

function handleInput(message, connection) {
    if (connection.team) {
        game.emit('input', message.action, message.status, connection.team);
    }
}

console.log("Game server listening on port " + shared.socket_port);
console.log("Http server listening on port " + shared.http_port);

// create a remote repl
net.createServer(function(socket) {
    var remote = repl.start("REMOTE:node.PONG! > ", socket);

    remote.context.restart = restart;

    remote.context.game = function() {
        return game;
    };
}).listen(shared.repl_port, "localhost");

console.log("Remote REPL listening on port " + shared.repl_port);

// start a local REPL
var local = repl.start("node.PONG! > ");

local.context.game = function() {
    return game;
};

local.context.connections = connections;

// restart the game
local.context.restart = restart;

// stop the server when we close the repl
local.on('exit', function() {
    process.exit(0);
});
