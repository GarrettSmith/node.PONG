$(function () {

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
    };

    connection.onmessage = function (message) {
        // handle incoming message
    };
});