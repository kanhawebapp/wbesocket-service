import { insertData } from "../chatapi/messageService.js";
import { chatReject } from "../chatapi/chatReject.js";
import { autoChat } from "../chatapi/autoChat.js";
import { comChat } from "../chatapi/comChat.js";
import { DateTime } from "luxon";
import { insert_message } from "../controller/InsertMessage.js";
import crypto from "crypto";
import sanitizeHtml from "sanitize-html";

const sentRequests = {};
const requestCooldown = 1000;
const users = [];
const astroLocks = [];

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

function encryptMessage(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { iv: iv.toString("hex"), encryptedData: encrypted };
}

function decryptMessage(encryptedData, iv) {
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, "hex"));
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function userJoinGroup(id, room_id) {
  const exists = users.find(u => u.id === id && u.room_id === room_id);
  if (!exists) {
    const user = { id, room_id };
    users.push(user);
    return user;
  }
  return exists;
}

async function socketHandler(io, pubClient, subClient) {
	try{
  subClient.subscribe([
    "chat_requests",
    "chat_status",
    "messages",
    "room_notification",
    "typing",
    "leave_chat",
    "user_disconnected",
    "call_requests",
    "customer_recharge"
  ], (err) => {
    if (err) console.error("data---------", err);
  });

  subClient.on("message", (channel, message) => {
	 console.log("-------------channel-----------------------"+channel);
    const data = JSON.parse(message);

    switch (channel) {
      case "chat_requests":
        io.emit("new_chat_request", data);
        break;

      case "chat_status":
        io.emit(data.status === "Accepted" ? "chat_started_user" : "chat_rejected", data);
        if (data.status === "Accepted") {
          io.emit("chat_started_astrologer", data);
          io.emit("user_conformation_chat", data);
        }
        break;

      case "messages":
        if (data.message?.encryptedData) {
          data.message = decryptMessage(data.message.encryptedData, data.message.iv);
        }
        io.to(data.room_id).emit("receive_message", data);
        break;

      case "room_notification":
        io.to(data.roomid).emit("roomNotification", data);
        break;

      case "typing":
        io.to(data.roomid).emit("typing", data);
        break;

      case "leave_chat":
        io.to(data.roomId).emit("leave_chat", data);
        break;

      case "user_disconnected":
        io.to(data.roomId).emit("user_disconnected", data);
        break;

      case "call_requests":
        if (data.phoneNumber?.encryptedData) {
          data.phoneNumber = decryptMessage(data.phoneNumber.encryptedData, data.phoneNumber.iv);
        }
        io.emit("new_call_request", data);
        break;

      case "customer_recharge":
        const event = data.message.includes("completed")
          ? "recharge_complted"
          : data.message.includes("failed")
          ? "customer_recharge_fail"
          : "open_popup_astrologer";
        io.to(data.roomId).emit(event, data);
        break;
    }
  });

  io.on("connection", (socket) => {
    socket.on("chat_request", async (data) => {
      const userId = data.user_id;
      const astroId = sanitizeHtml(data.astro_id || "");
      const currentTimestamp = Date.now();

      if (sentRequests[userId]) {
        const timeElapsed = currentTimestamp - sentRequests[userId].timestamp;
        if (timeElapsed < requestCooldown) {
          return socket.emit("check_duplicate_request", {
            message: `${sanitizeHtml(data.userName || "")}, you've already sent a chat request. Please wait a moment before trying again.`,
          });
        }
      }

      sentRequests[userId] = { timestamp: currentTimestamp };

      // Cleanup after cooldown
      setTimeout(() => delete sentRequests[userId], requestCooldown);

      const encryptedPhone = encryptMessage(data.phoneNumber || "");
      const message = JSON.stringify({
        message: "Chat request sent successfully",
        userName: sanitizeHtml(data.userName || ""),
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        timeOfBirth: data.timeOfBirth,
        occupation: sanitizeHtml(data.occupation || ""),
        location: sanitizeHtml(data.location || ""),
        astro_id: astroId,
        user_id: userId,
        is_promotional: data.is_promotional,
        room_id: data.room_id,
        maximum_time: data.maximum_time,
        user_image: data.user_image,
      });
    });

    socket.on("chat_accepted_astrologer", (data) => {
      if (!data.room_id) return console.log("Error: Room ID missing");
      const roomId = String(data.room_id);
      const message = JSON.stringify({
        message: `Your astrologer has accepted your chat request! Room ID: ${roomId}`,
        status: "Accepted",
        roomid: roomId,
      });
      pubClient.publish("chat_status", message);
    });

    socket.on("chat_rejected_astrologer", async (data) => {
      if (!data.room_id) return;
      const roomId = String(data.room_id);
      const astroId = sanitizeHtml(data.astro_id || "");
      try {
        await chatReject({ roomId, astroId });
        const message = JSON.stringify({
          message: `Your astrologer has rejected your chat request!`,
          status: "rejected",
          roomid: roomId,
        });
        pubClient.publish("chat_status", message);
      } catch (error) {
        console.error("Error rejecting chat:", error);
      }
    });

    socket.on("chat_rejected_user", async (data, callback) => {
      if (!data.room_id) return;
      const roomId = String(data.room_id);
      const astroId = sanitizeHtml(data.astroid || "");
      if (callback) callback({ success: true, status: "rejected" });

      try {
        await chatReject({ roomId, astroId });
        const message = JSON.stringify({
          message: `Your user has rejected your chat request!`,
          status: "rejected",
          roomid: roomId,
        });
        pubClient.publish("chat_status", message);
      } catch (error) {
        console.error("Error rejecting chat by user:", error);
      }
    });

    socket.on("chat_accepted_user", (data) => {
      if (!data.room_id) return;
      const roomId = String(data.room_id);
      const message = JSON.stringify({
        message: `Your user has accepted your chat request!`,
        status: "Accepted",
        roomid: roomId,
      });
      pubClient.publish("chat_status", message);
    });

    socket.on("joinChat", (data) => {
      const username = sanitizeHtml(data.username || "");
      const roomBase = data.astro_id
        ? `astro_${sanitizeHtml(data.astro_id)}`
        : `room_${sanitizeHtml(data.room_id)}`;

      socket.join(roomBase);
      socket.roomId = roomBase;

      const message = JSON.stringify({
        message: `${username} has joined the chat.`,
        roomid: roomBase,
      });

      pubClient.publish("room_notification", message);
    });
    
    socket.on("logout", (data) => {
  const roomBase = data.astro_id ? `astro_${sanitizeHtml(data.astro_id)}` : null;
  if (!roomBase) return;

  socket.leave(roomBase);
  console.log(`Astrologer left room: ${roomBase}`);

  const message = JSON.stringify({
    message: `Astrologer has left the chat.`,
    roomid: roomBase,
  });

  pubClient.publish("room_notification", message);
});


    // Add remaining socket events if needed...
  });

 } catch (err) {
    console.error("  → Error:", err.message);
  }
}

export default socketHandler;
