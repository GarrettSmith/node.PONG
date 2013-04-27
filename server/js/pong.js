var game = require('./game');

var bounceSpeedMultiplier = 1.1;
var bounceAngleScale = 0.3;

var paddleSidePadding = 20;

var maxSpeed = 300;
var maxPaddleSpeed = 400;

var edges = [
    "top",
    "left",
    "bottom",
    "right"
];

exports.messages = [

];

function limit(val, min, max) {
    val = Math.min(val, max);
    val = Math.max(val, min);
    return val;
}

exports.createGame = function(tickListeners) {

    var pong = game.createGame(tickListeners);

    var bounds = {
        width: 1000,
        height: 600
    };

    pong.bounds = bounds;

    function createBall() {
        return {
            x: bounds.width / 2,
            y: bounds.height / 2,
            dx : 300 * (Math.random() < 0.5 ? -1 : 1),
            dy: Math.random() * 200 - 100,
            radius: 5
        };
    }

    pong.ball = createBall();

    function createPaddle() {
        var paddle = {
            width:  6,
            height: 100,
            x: 0,
            y: bounds.height / 2,
            dy: 0
        };

        paddle.y -= paddle.height / 2;

        return paddle;
    }


    pong.leftPaddle = createPaddle();
    pong.leftPaddle.x = paddleSidePadding;

    pong.rightPaddle = createPaddle();
    pong.rightPaddle.x = bounds.width - paddleSidePadding - pong.rightPaddle.width;

    pong.input = {
        1: {
            up: 0,
            down: 0
        },
        2: {
            up: 0,
            down: 0
        }
    };

    function handleInput(action, status, team) {
        var delta = (status === 'keyup' ? -1 : 1);
        pong.input[team][action] += delta;
    }

    pong.on('input', handleInput);

    var moveBall = function(deltaTime) {
        pong.ball.x += (pong.ball.dx * deltaTime / 1000);
        pong.ball.y += (pong.ball.dy * deltaTime / 1000);
    };

    var bounceBall = function() {
        var bounced = false;
        // bounce on x axis
        // if (pong.ball.radius > ball.x || ball.x > bounds.width - ball.radius) {
        //     ball.dx *= -bounceSpeedMultiplier;
        //     ball.dx = limit(ball.dx, -maxSpeed, maxSpeed);
        //     bounced = true;
        // }
        // bouncs on y axis
        if (pong.ball.radius > pong.ball.y || pong.ball.y > bounds.height - pong.ball.radius) {
            pong.ball.dy *= -bounceSpeedMultiplier;
            pong.ball.dy = limit(pong.ball.dy, -maxSpeed, maxSpeed);
            bounced = true;
        }
        if (bounced) {
            // emit a bouncs event
            pong.emit('bounce', pong.ball.x, pong.ball.y);
        }
    };

    function contains(val, min, max) {
       return (min <= val && val <= max);
    }

    function checkCollision(paddle, ball) {
        // x axis
        var ballLeft = ball.x - ball.radius;
        var ballRight = ball.x + ball.radius;
        var paddleLeft = paddle.x;
        var paddleRight = paddle.x + paddle.width;
        if ( contains(paddleLeft, ballLeft, ballRight) ||
             contains(paddleRight, ballLeft, ballRight) ||
             contains(ballLeft, paddleLeft, paddleRight) ||
             contains(ballRight, paddleLeft, paddleRight)) {
            // y axis
            var ballTop = ball.y - ball.radius;
            var ballBottom = ball.y + ball.radius;
            var paddleTop = paddle.y;
            var paddleBottom = paddle.y + paddle.height;
            return (contains(paddleTop, ballTop, ballBottom) ||
                    contains(paddleBottom, ballTop, ballBottom) ||
                    contains(ballTop, paddleTop, paddleBottom) ||
                    contains(ballBottom, paddleTop, paddleBottom) );

        }
        // fall through to failing
        return false;
    }

    function bouncePaddle() {
        if (checkCollision(pong.leftPaddle, pong.ball)) {
            pong.ball.dx *= -bounceSpeedMultiplier;
            pong.ball.dy += pong.leftPaddle.dy * bounceAngleScale;
            pong.emit('hitPaddle', pong.leftPaddle);
        }
        else if (checkCollision(pong.rightPaddle, pong.ball)) {
            pong.ball.dx *= -bounceSpeedMultiplier;
            pong.ball.dy += pong.rightPaddle.dy * bounceAngleScale;
            pong.emit('hitPaddle', pong.rightPaddle);
        }
    }

    function calculateDeltas() {
        //set dy from input
        var up = pong.input[1].up;
        var down = pong.input[1].down;
        pong.leftPaddle.dy = calcDelta(up, down);

        up = pong.input[2].up;
        down = pong.input[2].down;
        pong.rightPaddle.dy = calcDelta(up, down);
    }

    function calcDelta(up, down) {
        var min = Math.min(up, down);
        var max = Math.max(up, down);
        var delta = (up > down ? -1 : 1); // up or down?
        //delta *= max / (max + min); // ratio
        delta *= (max === 0 ? 0 : 1); // don't move if no votes
        delta *= (max === min ? 0 : 1); // if a tie don't move
        delta *= maxPaddleSpeed;
        return delta;
    }

    function movePaddles(deltaTime) {
        pong.leftPaddle.y += (pong.leftPaddle.dy * deltaTime / 1000);
        pong.rightPaddle.y += (pong.rightPaddle.dy * deltaTime / 1000);

        //TODO constrain
        constrain(pong.leftPaddle);
        constrain(pong.rightPaddle);
    }

    function constrain(paddle) {
        paddle.y = Math.max(paddle.y, 0);
        paddle.y = Math.min(paddle.y, pong.bounds.height - paddle.height);
    }

    pong.scores = {
        left: 0,
        right: 0
    };

    function checkForScore() {
        // left player scores
        if (pong.ball.x > bounds.width) {
            pong.emit('score', 'left');
            pong.ball = createBall();
        }
        // check for right player score
        else if(pong.ball.x < 0) {
            pong.emit('score', 'right');
            pong.ball = createBall();
        }

    }

    function increaseScore(player) {
        pong.scores[player] += 1;
    }
    pong.on('score', increaseScore);

    pong.on('tick', checkForScore);
    pong.on('tick', calculateDeltas);
    pong.on('tick', movePaddles);
    pong.on('tick', moveBall);
    pong.on('tick', bounceBall);
    pong.on('tick', bouncePaddle);

    return pong;
};