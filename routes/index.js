import { Router } from "express";
import ChatRoute from "./chatRoute.js";


const router = Router();

router.use("/api", ChatRoute);




export default router;
