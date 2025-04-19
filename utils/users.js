const users = [];

// Join user to chat
function userJoinGroup(id, room_id) {
  const user = {id, room_id};
  users.push(user);
  return user;
}

// Get current user
function getCurrentUserDetails(id) {
  return users.find((user) => user.id === id);
}


function userLeaveGroup(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

module.exports = {
  userJoinGroup,
  getCurrentUserDetails,
  userLeaveGroup,
};
