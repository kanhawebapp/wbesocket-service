import prisma from "../config/db.js";

class getChatHistory {
  static async getChat_History(req, res) {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    try {
      const chatHistory = await prisma.message.findMany({
        
        where: { session_id: session_id },
      });

      if (!chatHistory || chatHistory.length === 0) {
        return res
          .status(404)
          .json({ message: "No chat history found for this user." });
      }

      return res.status(200).json(chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return res
        .status(500)
        .json({
          message:
            error.message || "An error occurred while fetching chat history.",
        });
    }
  }
}

export default getChatHistory;
