var express = require('express'),
    app = express(),
    http = require('http'),
    socketio = require('socket.io');

var server = http.createServer(app);
var io = socketio.listen(server);
// start webserver on port 8080
server.listen(8080);
// add the public directory where we have our index
app.use(express.static(__dirname + '/public'));
console.log("Server running on port 8080");

let users = [];

io.on('connection', (socket) => {

});