$(function () {

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

	var canvas = $('#canavs');

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    console.info("Establishing connection...");
    var connection = new WebSocket('ws://127.0.0.1:' + 8080);

    connection.onopen = function () {
        // connection is opened and ready to use
        console.info("Connection Established");
    };

    connection.onerror = function (error) {
        // an error occurred when sending/receiving data
        console.error(error);
    };

    connection.onmessage = function (message) {
        // handle incoming message
        message = JSON.parse(message.data);//BISON.decode(message.data);
        // console.log(message);

       // update debug elements
       $('#time').text(formatMillis(message.time));
       $('#frame').text(message.frame.toString());
       $('#fps').text(message.fps.toString());
    };
});