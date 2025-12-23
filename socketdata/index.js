import { insertData } from "../chatapi/messageService.js";
import { chatReject } from "../chatapi/chatReject.js";
import { autoChat } from "../chatapi/autoChat.js";
import { comChat } from "../chatapi/comChat.js";
import { DateTime } from "luxon";
import { insert_message } from "../controller/InsertMessage.js";
import sanitizeHtml from "sanitize-html";

// ===== Utility Functions =====
const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

const users = [];
const requestCooldown = 1000;

function userJoinGroup(id, room_id) {
  const user = { id, room_id };
  users.push(user);
  return user;
}

function publish(pubClient, channel, payload) {
  try {
    pubClient.publish(channel, JSON.stringify(payload));
  } catch (err) {
    console.error(`[Publish Error] Channel: ${channel}`, err);
  }
}

function logEvent(event, data) {
   const ts = DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss");
  console.log(`[${ts}][${event}]`,data);
}
// ===== Redis Channel Handlers =====
const redisHandlers = (io) => ({
  chat_requests: (data) => io.emit("new_chat_request", data),

  chat_status: (data) => {
    if (data.status === "Accepted" && data.who === "user") {
      io.emit("chat_started_astrologer", data);
      io.emit("user_conformation_chat", data);
    }
    if (data.status === "rejected" && data.who === "user" && data.roomid) {
      io.emit("chat_rejected_astrologer", {
        message: `Your User has Reject your chat request`,
        status: "rejected",
        roomid: String(data.roomid),
      });
    }
  },

  messages: (data) => {
    console.log("[messages handler] Received data:", data);
    if (data.sender === "user") {
      console.log("[messages handler] Emitting to room (user):", data.room_id);
      io.to(data.room_id).emit("receive_message", data);
    } else if (data.sender === "Astrologer") {
      console.log("[messages handler] Emitting to room (Astrologer):", data.room_id);
     // io.to(data.room_id).emit("receive_message", data);
    } else {
      console.log("[messages handler] Unknown sender:", data.sender);
    }
  },

  room_notification: (data) => {
    console.log("[room_notification handler] Emitting to room:", data.roomid, data);
    io.to(data.roomid).emit("roomNotification", data);
  },

  user_typing: (data) => {
    console.log("[user_typing handler] Emitting typing to room:", data.roomid, data);
    io.to(data.roomid).emit("typing", data);
  },

  end_chat_by_user: (data) => {
    io.to(data.roomId).emit("leave_chat", data);
    io.to(data.roomId).emit("complted_chat", data);
  },

  user_disconnected: (data) => io.to(data.roomId).emit("user_disconnected", data),
  chat_reject_auto: (data) => io.to(data.roomId).emit("chat_reject_auto", data),

  customer_recharge: (data) => io.to(data.roomId).emit("open_popup_astrologer", data),

  customer_recharge_complted: (data) => io.to(data.roomId).emit("recharge_complted", data),

  customer_recharge_fail: (data) => io.to(data.roomId).emit("customer_recharge_fail", data),
});

// ===== Main Socket Handler =====
async function socketHandler(io, pubClient, subClient) {
  try {
    const channels = [
      "chat_requests",
      "chat_status",
      "messages",
      "user_typing",
      "end_chat_by_user",
      "user_disconnected",
      "chat_reject_auto",
      "customer_recharge",
      "customer_recharge_complted",
      "customer_recharge_fail",
    ];

    const handlers = redisHandlers(io);

    for (const channel of channels) {
      await subClient.pSubscribe(channel, async (message, ch) => {
        try {
          logEvent(`pSubscribe [${ch}]`, message);
          const data = JSON.parse(message);
          if (handlers[ch]) {
            try {
              handlers[ch](data);
            } catch (handlerErr) {
              console.error(`[Redis Handler Error] Channel: ${ch}`, handlerErr);
            }
          }
        } catch (parseErr) {
          console.error(`[Redis Message Parse Error] Channel: ${ch}`, parseErr);
        }
      });
    }

    io.on("connection", (socket) => {
      try {
        // Chat acceptance
        socket.on("chat_accepted_astrologer", (data) => {
          try {
            logEvent("chat_accepted_astrologer", data);
            if (!data.room_id) return;
            publish(pubClient, "chat_status", {
              message: `Your astrologer has accepted your chat request! Room ID: ${data.room_id}`,
              status: "Accepted",
              roomid: String(data.room_id),
              who: "astrologer",
            });
          } catch (err) {
            console.error("[Socket Error] chat_accepted_astrologer", err);
          }
        });

        // Chat rejection
        socket.on("chat_rejected_astrologer", async (data) => {
          try {
            logEvent("chat_rejected_astrologer", data);
            if (!data.room_id) return;
            await chatReject({
              roomId: String(data.room_id),
              astroId: sanitizeHtml(data.astro_id || ""),
            });
            publish(pubClient, "chat_status", {
              message: "Your astrologer has rejected your chat request!",
              status: "rejected",
              roomid: String(data.room_id),
              who: "astrologer",
            });
          } catch (err) {
            console.error("[Socket Error] chat_rejected_astrologer", err);
          }
        });

        // Send message
        socket.on("send_message", async (data) => {
          try {
            let sender =  "Astrologer";
            logEvent("send_message", data);
            const time = DateTime.now().setZone("Asia/Kolkata").toFormat("hh:mm:ss a");
            await insert_message({
              sender_id: data.sender_id,
              received_id: data.received_id,
              message: data.message,
              image: data.image,
              msg_id: data.msg_id,
              room_id: data.room_id,
              sender:sender,
              replyTo: data.replyTo || null,
            });
            publish(pubClient, "messages", {
              ...data,
              time,
              sender,
              replyTo: data.replyTo || null,
            });
          } catch (err) {
            console.error("[Socket Error] send_message", err);
          }
        });

        // Join chat
        socket.on("joinChat", (data) => {
          try {
            logEvent("joinChat", data);
            userJoinGroup(data.username, data.room_id);
            socket.join(String(data.room_id));
            socket.roomId = String(data.room_id);
            publish(pubClient, "room_notification", {
              message: `${data.username} has joined the chat.`,
              roomid: String(data.room_id),
            });
          } catch (err) {
            console.error("[Socket Error] joinChat", err);
          }
        });

        // Typing
        socket.on("typing", (data) => {
          try {
            socket.to(data.room_id).emit("typing", {
              typing: data.typing,
              user_name: data.user_name,
              roomid: data.room_id,
            });
            publish(pubClient, "astrologer_typing", {
              typing: data.typing,
              user_name: data.user_name,
              roomid: data.room_id,
            });
          } catch (err) {
            console.error("[Socket Error] typing", err);
          }
        });

        // Complete chat
        socket.on("complted_chat", async (data) => {
          try {
            logEvent("complted_chat", data);
            await comChat({ roomId: data.room_id });
            socket.broadcast.to(data.room_id).emit("complted_chat", { message: `User has left the ${data.room_id} chat.`, roomId: data.room_id, status: "leave" });
            socket.emit("complted_chat", { message: `You have left the ${data.room_id} chat.`, roomId: data.room_id, status: "leave" });
            socket.leave(data.room_id);
            publish(pubClient, "end_chat_by_astrologer", { message: `User has left the ${data.room_id} chat.`, roomId: data.room_id, status: "leave" });
          } catch (err) {
            console.error("[Socket Error] complted_chat", err);
          }
        });

      
        socket.on("autodisconnect", async (data) => {
          try {
            console.log("[Socket Event] autodisconnect", data);
           // await autoChat({ roomId: data.room_id });
            let roomId = data.room_id;
            socket.to(roomId).emit("user_disconnected", { message: "A user has left the chat.", socketId: socket.id, roomId:roomId});
            publish(pubClient, "astrologer_disconnected", { message: "Auto Disconnect Chat By Astrologer.", socketId: socket.id, roomId:roomId });
            socket.leave(roomId);
          } catch (err) {
            console.error("[Socket Error] disconnect", err);
          }
        });

        // Logout
        socket.on("logout", (data) => {
          try {
            const roomBase = data.astro_id ? `astro_${sanitizeHtml(data.astro_id)}` : null;
            if (!roomBase) return;
            socket.leave(roomBase);
            publish(pubClient, "logout", { message: "Astrologer has left the chat.", roomid: roomBase });
          } catch (err) {
            console.error("[Socket Error] logout", err);
          }
        });
      } catch (err) {
        console.error("[Connection Error]", err);
      }
    });
  } catch (err) {
    console.error("socketHandler error:", err.message);
  }
}

export default socketHandler;
