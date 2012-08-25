var EventEmitter = require('events').EventEmitter;
var util = require('./util');

// Returns a new game object.
exports.createGame = function(tickListener) {
    var game = new EventEmitter();

    // the time the game was started
    var startTime;

    // The ticking interval
    var ticker;

    // the last time the game loop was ran in game time
    var lastTickTime = 0;

    // returns the current game time
    function currentGameTime () {
        return Date.now() - startTime;
    }

    // the number of ticks since start
    var currentFrame = 0;

    // register the tick listener if one was given
    if (typeof tickListener !== undefined ) {
        game.on('tick', tickListener);
    }

    // emit a tick event and maintain time variables
    var tick = function() {
        // increment the frame count
        currentFrame += 1;
        // the time since last ticke
        var deltaTime = currentGameTime() - lastTickTime;
        // record this as the last time ticked
        lastTickTime = currentGameTime();
        // emit the event
        game.emit('tick', deltaTime);
    };

    // start running the game loop
    game.start = function(tickRate) {
        // use the given tick rate or 60 fps
        tickRate = util.optional(tickRate, 1000 / 60);

        // record the start time
        startTime = Date.now();

        // this ticks at the tick rate firing tick events to run the game loop
        ticker = setInterval(tick, tickRate);

        // emit a start event
        game.emit('start');
    };

    // stops the running game loop
    game.stop = function() {
        // stop the game loop
        clearInterval(ticker);

        // emit a stop event
        game.emit('stop');
    };

    return game;
};
