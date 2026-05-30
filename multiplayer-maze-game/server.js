const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.static("public"));

const io = new Server(server, {
    cors: { origin: "*" }
});

let players = {};

io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    players[socket.id] = {
        x: 0,
        y: 0,
        color: `hsl(${Math.random()*360},100%,50%)`
    };

    io.emit("state", players);

    socket.on("move", (data) => {
        if (!players[socket.id]) return;

        players[socket.id].x = data.x;
        players[socket.id].y = data.y;

        io.emit("state", players);
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("state", players);
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
