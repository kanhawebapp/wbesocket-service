

import { Router } from "express";
import MessageStore from "../controller/MessageStore.js";
import getChatHistory from "../controller/getChatHistory.js";


const router=Router();
router.post("/chat/message", MessageStore.generate_message);
router.get("/chat/history", getChatHistory.getChat_History);
export default router;