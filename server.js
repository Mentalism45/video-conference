const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Use 4000 by default to avoid conflicts with other local apps
const PORT = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/room/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

io.on('connection', socket => {
  socket.on('join-room', roomId => {
    socket.join(roomId);

    const room = io.sockets.adapter.rooms.get(roomId) || new Set();
    const existingUsers = Array.from(room).filter(id => id !== socket.id);

    // Tell the new client who is already in the room
    socket.emit('existing-users', existingUsers);

    // Let others know a new user joined (optional, mostly for UI)
    socket.to(roomId).emit('user-joined', socket.id);

    socket.on('offer', ({ to, offer }) => {
      io.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }) => {
      io.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-left', socket.id);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

