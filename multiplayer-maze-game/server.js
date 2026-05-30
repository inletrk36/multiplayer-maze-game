const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.static("public"));

const io = new Server(server, {
    cors: { origin: "*" }
});

const rooms = {};
const players = {};

function makeCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}

io.on("connection", (socket) => {

    console.log("connected:", socket.id);

    socket.on("createRoom", () => {

        let code;

        do {
            code = makeCode();
        } while (rooms[code]);

        rooms[code] = {
            players: {}
        };

        socket.join(code);

        players[socket.id] = {
            room: code,
            x: 0,
            y: 0,
            color: `hsl(${Math.random()*360},100%,50%)`
        };

        rooms[code].players[socket.id] = players[socket.id];

        socket.emit("roomCreated", code);

        io.to(code).emit("state", rooms[code].players);

        console.log("Room created:", code);
    });

    socket.on("joinRoom", (code) => {

        code = String(code).toUpperCase();

        if (!rooms[code]) {
            socket.emit("errorMessage", "Room not found");
            return;
        }

        socket.join(code);

        players[socket.id] = {
            room: code,
            x: 0,
            y: 0,
            color: `hsl(${Math.random()*360},100%,50%)`
        };

        rooms[code].players[socket.id] = players[socket.id];

        socket.emit("joinedRoom", code);

        io.to(code).emit("state", rooms[code].players);

        console.log(socket.id, "joined", code);
    });

    socket.on("move", (data) => {

        const p = players[socket.id];

        if (!p) return;

        p.x = data.x;
        p.y = data.y;

        io.to(p.room).emit(
            "state",
            rooms[p.room].players
        );
    });

    socket.on("disconnect", () => {

        const p = players[socket.id];

        if (!p) return;

        const room = p.room;

        delete rooms[room].players[socket.id];
        delete players[socket.id];

        io.to(room).emit(
            "state",
            rooms[room].players
        );

        if (
            Object.keys(
                rooms[room].players
            ).length === 0
        ) {
            delete rooms[room];
            console.log("Deleted room:", room);
        }
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
