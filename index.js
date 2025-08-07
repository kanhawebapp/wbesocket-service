import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import Routes from "./routes/index.js";
import socketHandler from "./socketdata/index.js";
import swaggerUi from "swagger-ui-express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createOrder } from "./controller/createPayment.js";
import { verifyPayment } from "./controller/verifyPayment.js";
dotenv.config();
const app = express();
const port = process.env.PORT || 8001;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await pubClient.connect();
await subClient.connect();
const dhwaniNamespace = io.of("/dhwani-astro");
// Attach handler
socketHandler(dhwaniNamespace, pubClient, subClient); 

io.use((socket, next) => {
  console.log("Socket connection attempt:", socket.handshake.auth);
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: Token missing"));
  jwt.verify(token, process.env.JWT_SECRET || "7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0", (err, decoded) => {
    if (err) return next(new Error("Authentication error: Invalid token"));
    socket.user = decoded;
    next();
  });
});


socketHandler(io, pubClient, subClient);

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(Routes);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile)); // Uncomment when swaggerFile is available

app.get("/", (req, res) => {
  res.send("Welcome to the Chat Application");
});

app.post("/api/create-order", createOrder);
app.post("/api/verify-Payment", verifyPayment);

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});