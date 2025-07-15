import prisma from "../config/db.js";
class MessageStore {
  static async generate_message(req, res) {
    try {
      const {
        sender_id,
        received_id,
        message,

        image,
        room_id,
      } = req.body;
      if (!sender_id) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }
      const newChat = {
        user_id: sender_id,
        receiver_id: received_id,
        message: message,
        image: "",
        session_id: room_id || "",
      };
      const tempChat = await prisma.Message.create({
        data: newChat,
      });

      return res.status(200).json({
        staus: true,
        message_id: room_id,
      });
    } catch (error) {
      console.error("Error creating temp chat:", error);

      return res.status(500).json({
        message: "Something went wrong, please try again later",
        error: error.message,
      });
    }
  }
}

export default MessageStore;
