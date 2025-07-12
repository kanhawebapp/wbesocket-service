const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { createOrder } = require("./controller/createPayment");
const { verifyPayment } = require("./controller/verifyPayment");
const  socketHandler  = require("./socketdata");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8001;

const io = socketIo(server, {
  cors: {
    origin: "*", // Replace with specific origin in production
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Use specific options in production

socketHandler(io);

// API routes
app.post("/api/create-order", createOrder);
app.post("/api/verify-Payment", verifyPayment);

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
