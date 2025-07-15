import db from "../utils/database";

async function markChatRejectedByAstrologer(roomId, astroId) {
  try {
    await db.query(
      `UPDATE users_details SET availability = 1 WHERE user_id = ?`,
      [astroId]
    );
    await db.query(
      `UPDATE tbl_call_chat_request SET request_status = 4 WHERE request_session_id = ?`,
      [roomId]
    );

    return { status: true, message: "Chat Reject successfully" };
  } catch (error) {
    return { status: false, message: error.message };
  }
}

async function markChatRejectedByUser(roomId) {
  const sql = `UPDATE chat_requests SET status = 'rejected_by_user', rejected_at = NOW() WHERE room_id = ?`;
  try {
    await db.query(sql, [roomId]);
  } catch (error) {
    console.error("Error updating chat rejection status:", error);
    throw error;
  }
}

module.exports = {
  markChatRejectedByAstrologer,
  markChatRejectedByUser,
};
