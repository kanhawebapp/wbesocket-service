import prisma from "../config/db.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";

function saveBase64Image(base64String) {
  console.log("Saving image...");

  const match = base64String.match(/^data:image\/(.*);base64,/);
  if (!match) {
    throw new Error("Invalid base64 image string");
  }

  const extension = match[1];
  const imageName = `${Date.now()}.${extension}`;
  const base64Data = base64String.replace(/^data:image\/.*;base64,/, "").replace(/ /g, "+");

  const uploadDir = process.env.UPLOADS_DIR;
  console.log("UPLOAD DIR:", uploadDir);

  if (!fs.existsSync(uploadDir)) {
    console.log("Creating upload directory:", uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, imageName);
  console.log("Final file path:", filePath);

  try {
    fs.writeFileSync(filePath, base64Data, "base64");
    console.log(` Image saved at: ${filePath}`);
  } catch (err) {
    console.error(" Error writing file:", err);
  }

  return imageName;
}

const insert_message = async (data) => {
  try {
    let imageName = "";
    const { sender_id, received_id, message, image, room_id } = data;

    if (image) {
      imageName = saveBase64Image(image);
    }
    const newChat = {
      user_id: parseInt(sender_id),
      receiver_id: parseInt(received_id),
      message: message,
      msg_id: String(data.msg_id),
      sender: String(data.sender),
      replyTo: data.replyTo || null,
      image: imageName || "",
      status: 1,
      session_id: room_id,
    };

    const tempChat = await prisma.message.create({
      data: newChat,
    });

    return { status: true, message_id: room_id };
  } catch (error) {
    console.error("Error creating message:", error);

    return { status: false, error: error.message };
  }
};

export { insert_message };
