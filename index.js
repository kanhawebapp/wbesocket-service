
import express from "express";
import date from "date-and-time";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import Routes from "./routes/index.js";
import socketHandler from "./socketdata/index.js";



import swaggerUi from 'swagger-ui-express';
import swaggerFile from './swagger-output.json' assert { type: 'json' };


import {createOrder} from "./controller/createPayment.js";
import {verifyPayment} from "./controller/verifyPayment.js";





const app = express();
const port = process.env.PORT || 8001;
app.use('/uploads', express.static('uploads'));
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); 
app.use(Routes); 
// app.use(express.json());

socketHandler(io);



app.get("/", (req, res) => {
  res.send("Welcome to the Chat Application");
});

// API routes
app.post("/api/create-order", createOrder);
app.post("/api/verify-Payment", verifyPayment);

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
