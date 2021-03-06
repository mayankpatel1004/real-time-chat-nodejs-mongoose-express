const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const port = 3752;
app.use(cors());
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

mongoose.connect("mongodb+srv://admin:admin@cluster0.my1u1.mongodb.net/test?retryWrites=true&w=majority",{
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then( () => {console.log("Connection Successful....")})
.catch((err) => console.log(err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3751",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", (data) => {
    insertMessage(data);
    socket.to(data.conversationID).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// Get Conversation data //
app.get('/getConversation', function(req, res) {
  let conversationID = req.query.conversationID;
  var conn = mongoose.connection;
  var collection = conn.collection('messages');
  collection.find({conversationID:conversationID}).toArray(function(err, result) {
    let data = {success :1,error :0,message: "Data Successfully Retrieved",data: result}
    res.send(JSON.stringify(data));
  });
});

function insertMessage(data){
  var conn = mongoose.connection;
    var user = {
      sender : data.author,
      time: data.time,
      message : data.message,
      conversationID: data.conversationID
    };
    conn.collection('messages').insertOne(user);
}