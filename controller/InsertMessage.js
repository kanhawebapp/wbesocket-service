import prisma from "../config/db.js";

import fs from "fs";

function saveBase64Image(base64String) {
  const match = base64String.match(/^data:image\/(.*);base64,/);
  if (!match) {
    throw new Error("Invalid base64 image string");
  }
  const extension = match[1];
  const imageName = `${Date.now()}.${extension}`;

  const base64Data = base64String
    .replace(/^data:image\/.*;base64,/, "")
    .replace(/ /g, "+");

  fs.writeFileSync(`./uploads/${imageName}`, base64Data, "base64");

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
