var clientID = 0;
var character = null;
var gameState = 0;
//0 = Awaiting Opponent
//1 = Your move
//2 = Opponent's Move
//3 = Game Over you won
//4 = Game Over you lost
//5 = Game Over tie

document.addEventListener('DOMContentLoaded', function ()
{
    document.getElementById('chat-input').addEventListener('focus', function ()
    {
        typing = true;
    });
    document.getElementById('chat-input').addEventListener('blur', function ()
    {
        typing = false;
    });
});


document.onkeyup = function (event)
{
    //user pressed and released enter key
    if (event.keyCode === 13)
    {
        if (!typing)
        {
            //user is not already typing, focus our chat text form
            chatInput.focus();
        }
        else
        {
            //user sent a message, unfocus our chat form 
            chatInput.blur();
        }
    }
}

var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');

var socket = io();
var typing = false;

//add a chat cell to our chat list view, and scroll to the bottom
socket.on('addToChat', function (data)
{

    console.log('got a chat message');
    chatText.innerHTML += '<div class="chatCell">' + data + '</div>';
    chatText.scrollTop = chatText.scrollHeight;

});


chatForm.onsubmit = function (e)
{
    //prevent the form from refreshing the page
    e.preventDefault();

    //call sendMsgToServer socket function, with form text value as argument
    socket.emit('sendMsgToServer', chatInput.value);
    chatInput.value = "";
}

//Handles player moves if the game is in the right state.
function makeMove(div)
{
    if (gameState == 1 && div.innerText == "")
    {
        //Handle move
        socket.emit('sendMove', div.id, clientID);
    }
}

//Receive ClientID
socket.on('getClientID', function (id, characterIcon)
{
    clientID = id;
    console.log("I am player id " + id);
    character = characterIcon;
});

//Receive Game Update from server
socket.on('updateGameState', function (state, grid)
{
    console.log(grid);
    stateChange(state);
    updateGrid(grid);
});

//Resets the game for client.
socket.on('resetGame', function (grid)
{
    for (var row = 0; row < grid.length; row++) 
    {
        for (var col = 0; col < grid[row].length; col++) 
        {
            var div = document.getElementById('box'+row+col);
            div.innerText = "";

            div.classList.add('hoverable');
            div.classList.remove('enemySquare');
            div.classList.remove('friendlySquare');
        }
    }
});

//Displays a status message appropriate to what is happening.
function stateChange(state)
{
    var status = document.getElementById('status');
    gameState = state;

    if (gameState == 0) status.innerText = "Waiting for second player.";
    else if (gameState == 1) status.innerText = "It is your turn.";
    else if (gameState == 2) status.innerText = "Waiting for opponent's move.";
    else if (gameState == 3) status.innerText = "You won!";
    else if (gameState == 4) status.innerText = "You lost :(";
    else if (gameState == 5) status.innerText = "You tied :|";
}

//Takes the provided 2d array and fills it out.
function updateGrid(grid)
{
    for (var row = 0; row < grid.length; row++) 
    {
        for (var col = 0; col < grid[row].length; col++) 
        {
            var div = document.getElementById('box'+row+col);
            div.innerText = grid[row][col];

            if(character == grid[row][col]) div.classList.add('friendlySquare');
            else if(character != grid[row][col] && grid[row][col] != null) div.classList.add('enemySquare');
            if(grid[row][col] != null) div.classList.remove('hoverable');
        }
    }
}

//Disconnect user on navigating away
//Not working yet
window.onbeforeunload = function() 
{
    socket.emit('disconnect', clientID);
};