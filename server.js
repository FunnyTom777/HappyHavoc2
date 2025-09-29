const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store connected players
const players = new Map();

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('player_join', (data) => {
        players.set(socket.id, data.player);
        // Send existing players to new player
        socket.emit('player_list', Object.fromEntries(players));
        // Broadcast new player to all other players
        socket.broadcast.emit('player_join', {
            id: socket.id,
            player: data.player
        });
    });

    socket.on('player_move', (data) => {
        if (players.has(socket.id)) {
            const player = players.get(socket.id);
            player.x = data.x;
            player.y = data.y;
            socket.broadcast.emit('player_move', data);
        }
    });

    socket.on('chat_message', (data) => {
        socket.broadcast.emit('chat_message', data);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        players.delete(socket.id);
        io.emit('player_leave', socket.id);
    });
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log(`Server running on port ${port}`);
});