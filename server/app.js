var express = require("express");
var cors = require("cors");
const { application } = require("express");
var app = express();
const server = require("http").createServer(app);
app.use(cors());
const io = require("socket.io")(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 8000;

io.on("connection", (socket) => {
    socket.emit("activeUsers")
    socket.emit("getId", socket.id)
    socket.on("chat", (id, chat) => {
        io.emit("sendChat", id, chat, socket.id);
    });
    socket.on("disconnect", () => {
        socket.broadcast.emit("notification", socket.id);
        let onlineUsers = io.engine.clientsCount
        io.emit("countUsers", onlineUsers)
    });
    socket.on("usernameChange", (username, socketid) => {
        socket.broadcast.emit("resetChat", username, socketid);
    });
    socket.on("userTyping", (socketid, type) => {
        socket.broadcast.emit("someoneTyping", socketid, type)
    })
    socket.on("activeUsers", () => {
        let onlineUsers = io.engine.clientsCount
        io.emit("countUsers", onlineUsers)
    })
});


server.listen(PORT, () => {
    console.log("Application running successfully on port: " + PORT);
});