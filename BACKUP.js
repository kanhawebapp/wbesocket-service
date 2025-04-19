socket.on("joinRoom", (roomId) => {
  console.log(`User joining room: ${roomId}`);
  socket.join(roomId);
  console.log('Current Rooms:', socket.rooms); 
});

socket.on("chat_request", (data) => {

  socket.join(data.room_id);
  console.log('User joined room:', data.room_id);
  console.log('Current Rooms:', socket.rooms); 
});

socket.on("joinChat", (data) => {
  console.log(data);
  const user = userJoinGroup(data.username, data.room_id, data.joinpersonid);
  const roomId = String(user.room_id);
  socket.join(roomId);
  console.log('User joined room:', roomId);
  console.log('Current Rooms:', socket.rooms); 
  socket.broadcast.to(roomId).emit("roomNotification", {
    message: `${data.username} has joined the chat.`,
  });
});