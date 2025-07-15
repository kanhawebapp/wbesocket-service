

import { Router } from "express";
import MessageStore from "../controller/MessageStore.js";

const router=Router();
router.post("/chat/message", MessageStore.generate_message);
export default router;