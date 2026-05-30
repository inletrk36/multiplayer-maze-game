const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// IMPORTANT: needed for hosting HTML + JS
app.use(express.static("public"));

const io = new Server(server, {
    cors: { origin: "*" }
});

let players = {};

io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    players[socket.id] = { x: 0, y: 0 };

    socket.on("move", (data) => {
        let p = players[socket.id];
        if (!p) return;

        p.x += data.x;
        p.y += data.y;

        io.emit("state", players);
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});