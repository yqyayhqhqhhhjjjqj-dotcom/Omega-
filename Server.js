const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

let waiting = null;

io.on("connection", socket => {
    if (waiting === null) {
        waiting = socket;
    } else {
        waiting.emit("match", socket.id);
        socket.emit("match", waiting.id);
        waiting = null;
    }

    socket.on("signal", data => {
        io.to(data.to).emit("signal", { from: socket.id, signal: data.signal });
    });

    socket.on("disconnect", () => {
        if (waiting === socket) waiting = null;
    });
});

server.listen(3000, () => console.log("Servidor listo en puerto 3000"));
