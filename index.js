const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mysql = require("mysql2");
const date = require("date-and-time");
const { userJoinGroup } = require("./utils/users");
const cors = require("cors");

const app = express();
const server = http.createServer(app);


// app.use(
//   cors({
//     origin: "http://localhost:8000", 
//     methods: ["GET", "POST"],
//   })
// );

// const io = socketIo(server, {
//   cors: {
//     origin: "http://localhost:8000", 
//     methods: ["GET", "POST"],
//   },
// });



const io = socketIo(server, {
  cors: {
    origin: "https://socket-chat-7axx.onrender.com", 
    methods: ["GET", "POST"],
  },
});




const sentRequests = {};
const requestCooldown = 1000;
const roomTimes = {};
const REJECTION_TIMEOUT = 60000;

io.on("connection", (socket) => {
socket.on("chat_request", (data) => {
    console.log("Received", data);
    const userId = data.user_id;
    const astro_id = data.astro_id;
//     const requiredFields = [
//       "userName",
//       "gender",

//       "phoneNumber",
//       "astro_id",
//       "user_id",
//       "room_id",
//       "is_promotional",
//     ];
// for (let field of requiredFields) {
//       if (
//         !data[field] ||
//         (typeof data[field] === "string" && data[field].trim() === "")
//       ) {
//         return socket.emit("invalid_request", {
//           message: `${field} is missing or empty. Please provide all necessary information.`,
//         });
//       }
//     }

    const currentTimestamp = Date.now();
     roomTimes[data.room_id] = Date.now();

    if (sentRequests[userId]) {
      const timeElapsed = currentTimestamp - sentRequests[userId].timestamp;
      if (timeElapsed < requestCooldown) {
        return socket.emit("check_duplicate_request", {
          message: `${data.userName}, you've already sent a chat request. Please wait a moment before trying again.`,
        });
      }
    }
    sentRequests[userId] = { timestamp: currentTimestamp };
    socket.broadcast.emit("new_chat_request", {
      message: "Chat request has been successfully sent",
      userName: data.userName,
      gender: data.gender,
      dateofbirth: data.dateOfBirth,
      timeOfBirth: data.timeOfBirth,
      occupation: data.occupation,
      location: data.location,
      phoneNumber: data.phoneNumber,
      astro_id: data.astro_id,
      user_id: userId,
      is_promotional: data.is_promotional,
      room_id: data.room_id,
      maximum_time: data.maximum_time,
    });






    socket.emit("astrologer_busy", {
      message: `${astro_id} astrologer is currently busy. Please try again later.`,
      astro_id: astro_id,
      status: "busy",
    });

 


  });



  socket.on("chat_accepted_astrologer", (data) => {

    console.log("Received chat_accepted_astrologer event:", data);

    if (!data.room_id) {
      console.log("Error: Room ID is missing.");
      return;
    }

    console.log(`Chat request accepted for Room ID: ${data}`);
    const roomId = String(data.room_id);
      socket.broadcast.emit("chat_started_user", {
          message: `Your astrologer has accepted your chat request! Room ID: ${roomId}`,
          status: "Accepted",
          roomid: roomId,
        });
        // socket.to(data.room_id).emit("chat_started_user", {
        //   message: `Your astrologer has accepted your chat request! Room ID: ${data.room_id}`,
        //   status: "Accepted",
        // });
      });
    
  

  // end  
  // chat reject astrloger

//   socket.on("chat_rejected_astrologer", (data) => {

//     console.log("Received chat_rejected_astrologer event:", data);
//     if (!data.room_id) {
//       console.log("Error: Room ID is missing.");
//       return;
//     }
//     const roomId = String(data.room_id);
//       socket.emit("chat_rejected", {
//           message: `Your astrologer has Reject your chat request!`,
//           status: "rejected",
//           roomid: roomId,
//         });
//     //  socket.broadcast.emit("chat_rejected", {
//     //       message: `Your astrologer has Reject your chat request!`,
//     //       status: "rejected",
//     //       roomid: roomId,
//     //     });
//  });

socket.on("chat_astrologer", (data) => {
  console.log("Received chat_rejected_astrologer event:", data);
  if (!data.room_id) {
    console.log("Error: Room ID is missing.");
    return;
  }

  const roomId = String(data.room_id);
  console.log("Rejecting chat for room:", roomId);

  // Send to the astrologer/client themselves
  socket.emit("chatrejected", {
    message: `You have rejected the chat request.`,
    status: "rejected",
    roomid: roomId,
  });

  // // Send to others in the same room
  // socket.to(roomId).emit("chatrejected", {
  //   message: `Your astrologer has rejected your chat request!`,
  //   status: "rejected",
  //   roomid: roomId,
  // });
});

    
  

  // end reject

  // chat reject user

  socket.on("chat_rejected_user", (data) => {
    if (!data.room_id) {
      console.log("Error: Room ID is missing.");
      return;
    }
    const roomId = String(data.room_id);
   
     socket.emit("chat_rejected_astrologer", {
          message: `Your User has Reject your chat request`,
          status: "rejected",
          roomid: roomId,
        });
        // end

        // astrologer site
        socket.broadcast.emit("chat_rejected_astrologer", {
          message: `Your User has Reject your chat request`,
          status: "rejected",
          roomid: roomId,
        });
        // end
      });
    
  

  // end reject

  // appect chat user

  socket.on("chat_accepted_user", (data) => {
    if (!data.room_id) {
      console.log("Error: Room ID is missing.");
      return;
    }
    const roomId = data.room_id;
 socket.emit("user_conformation_chat", {
          message: `Your Astrologer has accepted your chat request`,
          status: "Accepted",
          roomid: roomId,
        });

        socket.broadcast.emit("chat_started_astrologer", {
          message: `Your User has accepted your chat request`,
          status: "Accepted",
          roomid: roomId,
        });
      });
    
  

  // end


  socket.on("joinChat", (data) => {
    console.log(data);
 const user = userJoinGroup(data.username, data.room_id, data.joinpersonid);
const roomId = String(user.room_id);
 socket.join(roomId);
 // Broadcast a notification to others in the room
    socket.broadcast.to(roomId).emit("roomNotification", {
        message: `${data.username} has joined the chat.`,
    });
console.log('socket',socket.id);
 socket.emit("roomNotification", {
        message: `Welcome to the chat, ${data.username}!`,
    });
});


  

socket.on('send_message', (data) => {
  console.log('Received message:', data);
  const { sender_id, room_id, received_id, message,sender, image } = data;
  const now = new Date();
  const time = date.format(now, 'YYYY/MM/DD HH:mm:ss');
  socket.broadcast.to(room_id).emit('receive_message', {
   sender,
    sender_id,
    received_id,
    message,
    time,
    image,
  });
});

  socket.on("autodisconnect", (data) => {

    console.log("Auto disconnect event received:",data.room_id);
    
    if (data.room_id) {
       socket.broadcast.emit("chat_reject_auto", {
            message: `${data.room_id} has been automatically rejected after 1 minute.`,
            roomId: data.room_id,
          });
          console.log(`Chat rejected for room ${data.room_id} after 1 minute`);

       
        } else {
          console.log("Chat accepted or not enough time has passed.");
        }
      
      
    
  });

  // typeing

  socket.on("typing", (data) => {
    console.log(`typing... ${data.typing}`);
    const roomId = data.room_id;
    socket.to(roomId).emit("typing", {
      typing: data.typing,
      user_name: data.user_name,
    });
  });

  // end

  const roomTimes = [];

  socket.on("leave_chat", (data) => {
    const roomId = data.room_id;
  
    console.log("Leaving chat room:", roomId);
    socket.broadcast.to(roomId).emit("leave_chat", {
      message: `User has left the ${roomId} chat.`,
      roomId: roomId,
      status: "leave",
    });
    socket.emit("leave_chat", {
      message: `You have left the ${roomId} chat.`,
      roomId: roomId,
      status: "leave",
    });
    socket.leave(roomId);
  });



  socket.on("complted_chat", (data) => {
    const roomId = data.room_id;
  
    console.log("Leaving chat room:", roomId);
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
  });

});








server.listen(3000, () => {
  console.log("listening on *:3000");
});