(function () {

    (function() {
        var requestAnimationFrame =
            window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        window.requestAnimationFrame = requestAnimationFrame;

        // if user is running mozilla then use it's built-in WebSocket
        window.WebSocket = window.WebSocket || window.MozWebSocket;
    })();

    var game_server = '192.168.100.109';
    var game_port = 8880;

    var mousetrap = require('mousetrap');
    var bison = require('bison');

    var voting = false;

    var canvas;
    var context;

    var time;
    var frame;
    var fps;

    var last_msg_time = 0;

    var team_select;

    var redUpvotes, redDownVotes, redUpArrow, redDownArrow;
    var blueUpVotes, blueDownVotes, blueUpArrow, blueDownArrow;

    var connection;
    var connection_attempts;
    var max_connection_attempts = 20;
    var reconnect_delay = 1000; //ms

    var is_paused = false;

    var easing = true;

    var ball = {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0
    };

    var next_ball = ball;

    var leftPaddle = {
        x: 0,
        y: 0,
        dy: 0
    };

    var next_leftPaddle = leftPaddle;

    var rightPaddle = {
        x: 0,
        y: 0,
        dy: 0
    };

    var next_rightPaddle = rightPaddle;

    var scores = {
        left: 0,
        right: 0
    };

    // colours
    var red = "#FF6464";
    var blue ="#64EAFF";

    var ball_stroke = "white";

    var glow_radius = 8;

    $.domReady(function() {
        canvas = $('#canvas')[0];
        context = canvas.getContext('2d');

        time = $('#time');
        frame = $('#frame');
        fps = $('#fps');

        team_select = $('#team-select');

        redUpVotes = $('#red-up-votes');
        redDownVotes = $('#red-down-votes');
        redUpArrow = $('#red-up-arrow');
        redDownArrow = $('#red-down-arrow');

        blueUpVotes = $('#blue-up-votes');
        blueDownVotes = $('#blue-down-votes');
        blueUpArrow = $('#blue-up-arrow');
        blueDownArrow = $('#blue-down-arrow');

        //register team selecting
        $('#button-1').click(function(){
            joinTeam(1);
        });
        $('#button-2').click(function(){
            joinTeam(2);
        });

        // register to keyboard events
        registerInput("up", "up");
        registerInput("down", "down");
        registerInput("w", "up");
        registerInput("s", "down");

        var ease_toggle = $('#easing');

        ease_toggle.click(function() {
            setEasing(!easing);
        });

        ease_toggle.attr('checked', 'checked');

        setupConnection();
    });

    function setEasing(set) {
        easing = set;
    }

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
        var daysString = (d === 0 ? '' : (d === 1 ? "1 day" : "" + d + "days"));
        return (daysString +
            twoDigits(h) + ':' +
            twoDigits(m) + ':' +
            twoDigits(s));
    }

    function twoDigits(number) {
        if (number < 10) {
            number = "0" + number;
        }
        return number;
    }

    function setupConnection() {
        console.info("Establishing Connection with " +
            'ws://' + game_server + ':' + game_port);
        connection = new WebSocket('ws://' + game_server + ':' + game_port);
        connection.onclose = onclose;
        connection. onopen = onopen;
        connection.onerror = onerror;
        connection.onmessage = onmessage;

    }

    function onopen() {
        // connection is opened and ready to use
        console.info("Connection Established");
        connection_attempts = 0;
        resume();
    }

    function onclose() {
        console.log("Connection Closed");
        start_reconnect();
        pause();
    }

    function onerror(error) {
        // an error occurred when sending/receiving data
        console.error("Connection Error: " + error);
        // TODO quick fix
        voting = false;
    }

    function onmessage(message) {// handle incoming message
        message = JSON.parse(message.data);//BISON.decode(message.data);//
        // console.log(message);

       // update debug elements
       time.text(formatMillis(message.time));
       frame.text(message.frame.toString());
       fps.text(message.fps.toString());

       displayVotes(message.input);

       ball = next_ball;
       leftPaddle = next_leftPaddle;
       rightPaddle = next_rightPaddle;

       next_ball = message.ball;
       next_leftPaddle = message.leftPaddle;
       next_rightPaddle = message.rightPaddle;

       var dt = last_msg_time - message.time;
       last_msg_time = message.time;

       setDeltas(ball, next_ball, dt);
       setDeltas(leftPaddle, next_leftPaddle, dt);
       setDeltas(rightPaddle, next_rightPaddle, dt);

       scores = message.scores;
    }

    function setDeltas(obj, next_obj, dt) {
        var dx = obj.x - next_obj.x;
        var dy = obj.y - next_obj.y;

        dx /= dt / 1000;
        dy /= dt / 1000;

        obj.dx = dx;
        obj.dy = dy;
    }

    function reconnect() {
        if (connection_attempts < max_connection_attempts) {
            connection_attempts++;
            console.log("Attempting to Reconnect: " +
                connection_attempts + '/' + max_connection_attempts + " attempts");
            setupConnection();
        }
    }

    function start_reconnect() {
        connection = undefined;
        var delay;
        if (connection_attempts === 0) {
            delay = 0;
        }
        else {
            delay = reconnect_delay;
        }
        setTimeout(reconnect, delay);
    }

    var startTime = 0;

    function update(timestamp) {

        var timeStamp = (timeStamp || Date.now());
        var delta = timestamp - startTime;

        if (easing) ease(delta);

        startTime = timeStamp;

        drawCanvas();
        if (!is_paused) requestAnimationFrame(update);
    }

    function pause() {
        is_paused = true;
    }

    function resume() {
        is_paused = false;
        requestAnimationFrame(update);
    }

    function ease(delta) {
        ball.x += ball.dx * delta / 1000;
        ball.y += ball.dy * delta / 1000;

        leftPaddle.y += leftPaddle.dy * delta / 1000;
        rightPaddle.y += rightPaddle.dy * delta / 1000;
    }

    function drawCanvas() {
       clearCanvas();
       drawScores(scores.left, scores.right);
       drawBall(ball);
       drawPaddle(leftPaddle, red);
       drawPaddle(rightPaddle, blue);
    }

    /**
     * Joins the given team 1 is red, 2 is blue
     */
    function joinTeam(team) {
        var message = {
            type: 'join',
            team: team
        };
        message = JSON.stringify(message);
        connection.send(message);

        team_select.fadeOut(200);
    }

    function displayVotes(input) {
        displayTeamVotes(input[1].up, input[1].down, redUpVotes, redDownVotes,
            redUpArrow, redDownArrow);
        displayTeamVotes(input[2].up, input[2].down, blueUpVotes, blueDownVotes,
            blueUpArrow, blueDownArrow);
    }

    function displayTeamVotes(up, down, upElement, downElement, upArrow, downArrow) {
        var upPercent = 0;
        var downPercent = 0;
        var total = up + down;
        upArrow.removeClass('active');
        downArrow.removeClass('active');
        if (total !== 0) {
            upPercent = up / total * 100;
            downPercent = down / total * 100;
            // set arrows
            if (up !== down) {
                if (up > down) {
                    upArrow.addClass('active');
                } else {
                    downArrow.addClass('active');
                }
            }
        }
        upElement.text(Math.round(upPercent));
        downElement.text(Math.round(downPercent));
    }

    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawBall(ball) {
        context.strokeStyle = ball_stroke;
        context.shadowBlur = glow_radius;
        context.shadowColor = ball_stroke;
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true);
        context.closePath();
        context.stroke();
    }

    function drawPaddle(paddle, color) {
       context.strokeStyle = color;
       context.shadowBlur = glow_radius;
       context.shadowColor = color;
       context.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
       context.shadowBlur = 0;
   }

   function drawScores(left, right) {
        context.font = "120px monospace";
        context.strokeStyle = red;
        context.shadowBlur = glow_radius;
        context.shadowColor = red;
        context.strokeText(left.toString(), canvas.width / 6, canvas.height / 2);
        context.strokeStyle = blue;
        context.shadowColor = blue;
        context.strokeText(right.toString(), canvas.width * 2 / 3, canvas.height / 2);
        context.shadowBlur = 0;
    }

    function registerInput(key, actionName) {

        function createInputFunction(statusName, activate, callBack) {
            var func = function() {
                if (activate()) {
                    var message = {
                        type: 'input',
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
            function() {return !pressed && !voting;},
            function() {
                pressed = true;
                voting = true;
            });
        up = createInputFunction("keyup",
            function() {return pressed && voting;},
            function() {
                pressed = false;
                voting = false;
            });

        mousetrap.bind(key, down, "keydown");
        mousetrap.bind(key, up, "keyup");
    }
})();