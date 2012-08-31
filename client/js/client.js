(function () {

    var mousetrap = require('mousetrap');

    // convert milliseconds into a D:H:M:S string
    function formatMillis(millis) {
        millis /= 1000;
        var s = Math.floor(millis % 60);
        millis /= 60;
        var m = Math.floor(millis % 60);
        millis /= 60;
        var h = Math.floor(millis % 24);
        millis /= 24;
        var d = Math.floor(millis);
        return ("" + d + ':' + h + ':' + m + ':' + s);
    }

    var canvas = $('#canvas')[0];
    console.dir(canvas);
    var context = canvas.getContext('2d');

    var time = $('#time');
    var frame = $('#frame');
    var fps = $('#fps');

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    console.info("Establishing connection...");
    var connection = new WebSocket('ws://192.168.100.105:' + 8880);

    connection.onopen = function() {
        // connection is opened and ready to use
        console.info("Connection Established");
    };

    connection.onclose = function() {
        console.log("Connection closed");
    };

    connection.onerror = function(error) {
        // an error occurred when sending/receiving data
        console.error(error);
    };

    connection.onmessage = function (message) {
        // handle incoming message
        message = JSON.parse(message.data);//BISON.decode(message.data);
        // console.log(message);

       // update debug elements
       time.text(formatMillis(message.time));
       frame.text(message.frame.toString());
       fps.text(message.fps.toString());

       clearCanvas();
       drawScores(message.scores.left, message.scores.right);
       drawBall(message.ball);
       drawPaddle(message.leftPaddle);
       drawPaddle(message.rightPaddle);
    };

    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawBall(ball) {
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true);
        context.closePath();
        context.stroke();
    }

    function drawPaddle(paddle) {
        context.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }

    function drawScores(left, right) {
        context.font = "120px monospace";
        context.strokeText(left.toString(), canvas.width / 6, canvas.height / 2);
        context.strokeText(right.toString(), canvas.width * 2 / 3, canvas.height / 2);
    }

    function registerInput(key, actionName) {

        function createInputFunction(statusName, activate, callBack) {
            var func = function() {
                if (activate()) {
                    var message = {
                        action: actionName,
                        status: statusName
                    };
                    message = JSON.stringify(message);
                    connection.send(message);
                    callBack();
                }
                return false;
            };
            return func;
        }

        var up;
        var down;

        var pressed = false;

        down = createInputFunction("keydown",
            function() {return !pressed;},
            function() {
                pressed = true;
            });
        up = createInputFunction("keyup",
            function() {return pressed;},
            function() {
                pressed = false;
            });

        mousetrap.bind(key, down, "keydown");
        mousetrap.bind(key, up, "keyup");
    }

    // register to keyboard events
    registerInput("up", "rightUp");
    registerInput("down", "rightDown");
    registerInput("s", "leftDown");
    registerInput("w", "leftUp");
})();