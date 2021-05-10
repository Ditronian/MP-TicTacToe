//Start Express Server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var SOCKET_LIST = {}
console.log("Server started.");

//Declare where client files will be served from (ie HTML)
var path = require('path');
app.get('/', function (req, res)
{
    res.sendFile(__dirname + '/client/chat.html');
});
app.use(express.static(path.join(__dirname, 'client')));


//On client connection, do these things and allow these interactions.
io.sockets.on('connection', function (socket)
{

    console.log('new user!');
    var clientSocketId = Math.random();
    SOCKET_LIST[clientSocketId] = socket;

    //Send message to all clients on receiving
    socket.on('sendMsgToServer', function (message)
    {

        console.log('someone sent a message!');
        for (var client in SOCKET_LIST)
        {
            SOCKET_LIST[client].emit('addToChat', message);
        }

    });

    //Remove client from socket list on disconnect
    socket.on('disconnect', function ()
    {

        delete SOCKET_LIST[socket.id];

    });

});

server.listen(4141);