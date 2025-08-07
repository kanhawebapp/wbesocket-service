import { insertData } from "../chatapi/messageService.js";
import { chatReject } from "../chatapi/chatReject.js";
import { autoChat } from "../chatapi/autoChat.js";
import { comChat } from "../chatapi/comChat.js";
import { DateTime } from "luxon";
import { insert_message } from "../controller/InsertMessage.js";
import crypto from "crypto";
import sanitizeHtml from "sanitize-html";

function userJoinGroup(id, room_id) {
  const user = { id, room_id };
  users.push(user);
  return user;
}

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

async function socketHandler(io, pubClient, subClient) {
  try {
    const channels = [
      "chat_requests",
      "chat_status",
       "messages",
      // "room_notification",
      "user_typing",
       "end_chat_by_user",
       "user_disconnected",
      // "call_requests",
       "customer_recharge",
       "customer_recharge_complted",
    ];

    for (const channel of channels) {
      await subClient.pSubscribe(channel, async (message, ch) => {
        try {
          console.log(" [pSubscribe] Channel :", ch);
	        console.log(" [pSubscribe] mesage :", message);

          const data = JSON.parse(message);

          switch (ch) {
            case "chat_requests":
            io.emit("new_chat_request", data);
        break;
            case "chat_status":
              if (data.status === "Accepted" && data.who=="user") {
                 console.log("comming here after user acceptance");
                io.emit("chat_started_astrologer", data);
                io.emit("user_conformation_chat", data);
              }
              if(data.status === "rejected" && data.who=="user"){
		        console.log("---chat rejected by user--------"+JSON.stringify(data));
                          if (!data.roomid) {
                  return;
                }
		            console.log("---chat rejected by user--------"+JSON.stringify(data));
                const roomId = String(data.roomid);
                const astroId = String(data.astroid);
                try {
                  io.emit("chat_rejected_astrologer", {
                    message: `Your User has Reject your chat request`,
                    status: "rejected",
                    roomid: roomId,
                  });
                  
                } catch (error) {
                  console.log(
                    "Error while rejecting chat request by user:",
                    error.message
                  );
                }

              }
              break;

            case "messages":
             
	       if(data.sender=="user"){
              io.to(data.room_id).emit("receive_message", data);
		  }
              break;

            case "room_notification":
              io.to(data.roomid).emit("roomNotification", data);
              break;

            case "user_typing":
		          console.log("-----user typing-------"+JSON.stringify(data));
              io.to(data.roomid).emit("typing", data);
              break;

            case "end_chat_by_user":
             console.log("-----leave chat event end chat by user--------"+JSON.stringify(data));
              io.to(data.roomId).emit("leave_chat", data);
              io.to(data.roomId).emit("complted_chat", data);
              break;

            case "user_disconnected":
              io.to(data.roomId).emit("user_disconnected", data);
              break;

            case "call_requests":
              /*if (data.phoneNumber?.encryptedData) {
                data.phoneNumber = decryptMessage(data.phoneNumber.encryptedData, data.phoneNumber.iv);
              }
              io.emit("new_call_request", data);*/
              break;

            case "customer_recharge":
              console.log("----customer_recharge--------"+JSON.stringify(data));
              io.to(data.roomId).emit("open_popup_astrologer", data); 
              break;
            case "customer_recharge_complted":
              console.log("----customer_recharge_complted--------"+JSON.stringify(data));
              io.to(data.roomId).emit("recharge_complted", data); 
              break;
            case "customer_recharge_fail":
               console.log("----customer_recharge_fail--------"+JSON.stringify(data));
              io.to(data.roomId).emit("customer_recharge_fail", data); 
              break;
          }
        } catch (err) {
          console.error(" Redis message error:", err.message);
        }
      });
    }

    io.on("connection", (socket) => {
      socket.on("chat_accepted_astrologer", (data) => {
        console.log("----chat_accepted_astrologer--------"+JSON.stringify(data));
        if (!data.room_id) return;
        const roomId = String(data.room_id);
        const message = JSON.stringify({
          message: `Your astrologer has accepted your chat request! Room ID: ${roomId}`,
          status: "Accepted",
          roomid: roomId,
          who:"astrologer"
        });
        pubClient.publish("chat_status", message);
      });

      socket.on("chat_rejected_astrologer", async (data) => {
         console.log("----chat_rejected_astrologer--------"+JSON.stringify(data));
        if (!data.room_id) return;
        const roomId = String(data.room_id);
        const astroId = sanitizeHtml(data.astro_id || "");
        try {
          await chatReject({ roomId, astroId });
          const message = JSON.stringify({
            message: "Your astrologer has rejected your chat request!",
            status: "rejected",
            roomid: roomId,
            who:"astrologer"

          });
          pubClient.publish("chat_status", message);
        } catch (error) {
          console.error("Error rejecting chat:", error.message);
        }
      });

      socket.on("send_message", async (data) => {
        console.log("----send_message--------"+JSON.stringify(data));
      try {
        let date = DateTime.local();
        const { sender_id, room_id, received_id, message, sender, image } =
          data;
        const now = new Date();
        const time = DateTime.now()
          .setZone("Asia/Kolkata")
          .toFormat("hh:mm:ss a");

        const response = await insert_message({
          sender_id: sender_id,
          received_id: received_id,
          message: message,
          image: image,
          room_id: room_id,
          replyTo: data.replyTo || null,
        });
        if (response.status === true) {
        pubClient.publish("messages", JSON.stringify({
            sender,
            sender_id,
            received_id,
            room_id: room_id,
            message,
            replyTo: data.replyTo || null,
            time,
            image,
          }));
        }
        else{
          pubClient.publish("messages", JSON.stringify({
            sender,
            sender_id,
            received_id,
            room_id: room_id,
            message,
            replyTo: data.replyTo || null,
            time,
            image,
          }));

        }
        
       
      } catch (error) {
        console.error("DB insert error:", error);
      }
    });

     socket.on("joinChat", (data) => {
      console.log("----joinChat--------"+JSON.stringify(data));
      const user = userJoinGroup(
        data.username,
        data.room_id,
        data.joinpersonid
      );
      const roomId = String(data.room_id);
      socket.join(roomId);
      socket.roomId = roomId;
      console.log("socket", socket.id);
        const message = JSON.stringify({
          message: `${data.username} has joined the chat.`,
          roomid: roomId,
        });
      pubClient.publish("room_notification", message);
      
    });

     socket.on("typing", (data) => {
      const roomId = data.room_id;
      socket.to(roomId).emit("typing", {
        typing: data.typing,
        user_name: data.user_name,
        roomid: roomId,
      });

       pubClient.publish("astrologer_typing", JSON.stringify({
        typing: data.typing,
        user_name: data.user_name,
        roomid: roomId,
      }));
    });
    

    socket.on("complted_chat", async (data) => {
      try {
        console.log("-----------complted_chat  END CHAT BY ASTROLOGER----------"+JSON.stringify(data));
        const roomId = data.room_id;
        const response = await comChat({
          roomId: roomId,
        });

        socket.broadcast.to(roomId).emit("complted_chat", {
          message: `User has left the ${roomId} chat.`,
          roomId: roomId,
          status: "leave",
        });

        socket.emit("complted_chat", {
          message: `You have left the ${roomId} chat.`,
          roomId: roomId,
          status: "leave",
        });
        socket.leave(roomId);

        pubClient.publish("end_chat_by_astrologer", JSON.stringify({
          message: `User has left the ${roomId} chat.`,
          roomId: roomId,
          status: "leave",
          }));
      } catch (error) {}
    });


     let disconnected = false;

    socket.on("disconnect", async () => {
      if (disconnected) return;
      disconnected = true;

      const roomId = socket.roomId;
      if (roomId) {
        await autoChat({ roomId: roomId });
        socket.to(roomId).emit("user_disconnected", {
          message: "A user has left the chat.",
          socketId: socket.id,
          roomId: roomId,
        });

        pubClient.publish("astrologer_disconnected", JSON.stringify({
          message: "A user has left the chat.",
          socketId: socket.id,
          roomId: roomId,
          }));
        socket.leave(roomId);

      }
    });

     

      

      socket.on("logout", (data) => {
        const roomBase = data.astro_id ? `astro_${sanitizeHtml(data.astro_id)}` : null;
        if (!roomBase) return;

        socket.leave(roomBase);
        console.log(`Astrologer left room: ${roomBase}`);

        const message = JSON.stringify({
          message: "Astrologer has left the chat.",
          roomid: roomBase,
        });

        pubClient.publish("logout", message);
      });
    });
  } catch (err) {
    console.error("socketHandler error:", err.message);
  }
}




export default socketHandler;
