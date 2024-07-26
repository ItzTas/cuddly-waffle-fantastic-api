import { Router } from "express";
import { handlerCreateUser } from "../controllers/users_controlers.js";

const router = Router();

router.post("/users/accounts", handlerCreateUser);

export default router;
