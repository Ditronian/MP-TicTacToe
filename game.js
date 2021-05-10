//Start Server
const e = require('express');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
console.log("Server started.");

//Game variables
var SOCKET_LIST = {};
var players = [];
var gameState = 0;
//0 = Awaiting players
//1 = X's turn (player 0)
//2 = Y's turn (player 1)
//3 = Game Over x won
//4 = Game Over o won
//5 = Game Over tie

//Initialize the gamegrid
var gameGrid = new Array(3);
for (var i = 0; i < gameGrid.length; i++) 
{
    gameGrid[i] = new Array(3);
}


//Declare where client files will be served from (ie HTML)
var path = require('path');
app.get('/', function (req, res)
{
    res.sendFile(__dirname + '/client/game.html');
});
app.use(express.static(path.join(__dirname, 'client')));


//On client connection, do these things and allow these interactions.
io.sockets.on('connection', function (socket)
{
    //If server has less than 2 players, allow the user to login
    if (Object.keys(SOCKET_LIST).length < 2)
    {
        console.log('new user!');
        var clientSocketId = Math.random();
        SOCKET_LIST[clientSocketId] = socket;
        players.push(clientSocketId);
        if (clientSocketId == players[0]) socket.emit('getClientID', clientSocketId, 'X');
        else socket.emit('getClientID', clientSocketId, 'O');

        //If player 2 is here, start game
        if (players[1] != null) 
        {
            gameState = 1;
            updateGameState();
        }
    }

    //Send message to all clients on receiving chat msg
    socket.on('sendMsgToServer', function (message)
    {
        console.log('someone sent a message!');
        for (var client in SOCKET_LIST)
        {
            SOCKET_LIST[client].emit('addToChat', message);
        }

    });

    //Receives a player's move, update grid, check for win/tie, send to players
    socket.on('sendMove', function (moveString, clientSocketId)
    {
        moveString = moveString.replace("box", "");
        row = parseInt(moveString[0]);
        col = parseInt(moveString[1]);

        //Should have valid move checking here
        if (clientSocketId == players[0]) gameGrid[row][col] = 'X';
        else gameGrid[row][col] = 'O';


        //Check for wins and ties
        if (winCheck() && clientSocketId == players[0]) gameState = 3;           //Set X won
        else if (winCheck() && clientSocketId == players[1]) gameState = 4;     //Set O won
        else if (tieCheck()) gameState = 5;                                     //Set Tie
        else if (clientSocketId == players[0]) gameState = 2;                   //Set O's turn
        else if (clientSocketId == players[1]) gameState = 1;                   //Set X's turn

        updateGameState();
    });

    //Remove client from socket list on disconnect
    //Not quite Working yet, crashes on disconnect
    socket.on('disconnect', function (clientID)
    {
        delete SOCKET_LIST[socket.id];
        players = players.splice(players.findIndex(clientID), 1);
        console.log('Player logged off.');
    });
});

//Send the game grid to all players and tell them to update their game states
function updateGameState()
{
    if (gameState == 1) //X's turn
    {
        SOCKET_LIST[players[0]].emit('updateGameState', 1, gameGrid);
        SOCKET_LIST[players[1]].emit('updateGameState', 2, gameGrid);
    }
    else if (gameState == 2) //O's turn
    {
        SOCKET_LIST[players[1]].emit('updateGameState', 1, gameGrid);
        SOCKET_LIST[players[0]].emit('updateGameState', 2, gameGrid);
    }
    else if (gameState == 3) //X Won
    {
        SOCKET_LIST[players[0]].emit('updateGameState', 3, gameGrid);
        SOCKET_LIST[players[1]].emit('updateGameState', 4, gameGrid);
        setTimeout(() => {  gameReset(); }, 5000);
    }
    else if (gameState == 4) //O Won
    {
        SOCKET_LIST[players[0]].emit('updateGameState', 4, gameGrid);
        SOCKET_LIST[players[1]].emit('updateGameState', 3, gameGrid);
        setTimeout(() => {  gameReset(); }, 5000);
    }
    else if (gameState == 5) //Tie
    {
        SOCKET_LIST[players[0]].emit('updateGameState', 5, gameGrid);
        SOCKET_LIST[players[1]].emit('updateGameState', 5, gameGrid);
        setTimeout(() => {  gameReset(); }, 5000);
    }
}

//Checks if there is a winner
function winCheck()
{
    var win = false;

    //Check horizontals for wins
    for (var row = 0; row < gameGrid.length; row++) 
    {
        if (gameGrid[row][0] != null && gameGrid[row][0] == gameGrid[row][1] && gameGrid[row][0] == gameGrid[row][2]) 
        {
            win = true;
            break;
        }
    }

    //Check verticals for wins
    if (!win)
    {
        for (var row = 0; row < gameGrid.length; row++) 
        {
            for (var col = 0; col < gameGrid[row].length; col++) 
            {
                if (gameGrid[0][col] != null && gameGrid[0][col] == gameGrid[1][col] && gameGrid[0][col] == gameGrid[2][col]) 
                {
                    win = true;
                    break;
                }
            }
        }
    }

    //Check diagonals for wins
    if (!win)
    {
        if (gameGrid[0][0] != null && gameGrid[0][0] == gameGrid[1][1] && gameGrid[0][0] == gameGrid[2][2]) win = true;
        if (gameGrid[0][2] != null && gameGrid[0][2] == gameGrid[1][1] && gameGrid[0][2] == gameGrid[2][0]) win = true;
    }

    return win;
}

//Check If all tiles filled, therefore no winner
function tieCheck()
{
    var tie = true;

    for (var row = 0; row < gameGrid.length; row++) 
    {
        for (var col = 0; col < gameGrid[row].length; col++) 
        {
            if (gameGrid[row][col] == null) tie = false;
        }
    }

    return tie;
}

//Preps a new game for play
function gameReset()
{
    //Refresh the gamegrid
    gameGrid = new Array(3);
    for (var i = 0; i < gameGrid.length; i++) 
    {
        gameGrid[i] = new Array(3);
    }

    gameState = 1;

    //Command players to reset game
    SOCKET_LIST[players[0]].emit('resetGame', gameGrid);
    SOCKET_LIST[players[1]].emit('resetGame', gameGrid);

    updateGameState()
}

server.listen(4141);