var shared = require('../../shared/js/shared');

var WebSocketServer = require('websocket').server;
var connect = require('connect');
var http = require('http');
var _ = require('underscore');
var bison = require('bison');
var repl = require('repl');
var net = require('net');

var game;

function startGame() {
    game = require('./pong').createGame();

    var lastNotify = 0;
    var lastFrame = 0;
    var notifyRate = 10;

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
                scores: game.scores
            };

            // encode the message
            var message = JSON.stringify(state);//bison.encode(state);
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

var server = http.createServer().listen(shared.port);

// create the server
var wsServer = new WebSocketServer({
	httpServer: server
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
        game.emit('input', message.action, message.status);
	});

    connection.on('close', function(connection) {
        // close user connection
        connections.pop(connection);
        // console.info(request.origin + " disconnected");
    });
});

// setTimeout(function(){game.stop();}, 500);

console.log("Game server listening on port " + shared.port);

// create a remote repl
net.createServer(function(socket) {
    var remote = repl.start("REMOTE:node.PONG! > ", socket);

    remote.context.restart = restart;

    remote.context.game = function() {
        return game;
    };
}).listen(5001, "localhost");

console.log("Remote REPL listening on port 5001");

// start a local REPL
var local = repl.start("node.PONG! > ");

local.context.game = function() {
    return game;
};

// restart the game
local.context.restart = restart;

// stop the server when we close the repl
local.on('exit', function() {
    process.exit(0);
});
