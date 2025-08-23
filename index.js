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
const port = process.env.PORT;
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Ideally replace "*" with your frontend domain for security
    methods: ["GET", "POST"],
  },
});

// Redis connections
const pubClient = createClient({
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

const subClient = pubClient.duplicate();

await pubClient.connect();
await subClient.connect();

io.adapter(createAdapter(pubClient, subClient));


/**
 * JWT authentication middleware for Socket.IO
 */
const jwtAuthMiddleware = (socket, next) => {
  console.log("JWT Auth Middleware Invoked");
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.query?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1];

  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "super_secret_key_123",
    (err, decoded) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
      socket.user = decoded;
      next();
    }
  );
};

// Namespace for astrologer chat with JWT authentication
const dhwaniNamespace = io.of("/dhwani-astro");
dhwaniNamespace.use(jwtAuthMiddleware);

// Attach your socket handlers here
socketHandler(dhwaniNamespace, pubClient, subClient);
app.use("/uploads", express.static(process.env.UPLOADS_DIR || "uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use(Routes);

// Payment APIs
app.post("/api/create-order", createOrder);
app.post("/api/verify-Payment", verifyPayment);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to the Chat Application");
});

// Start server
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
