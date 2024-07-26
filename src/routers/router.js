import { Router } from "express";
import { handlerCreateUser } from "../controllers/users_controlers.js";
import { getUserById } from "../database/users_queries.js";

const router = Router();

router.post("/api/users/accounts", handlerCreateUser);
router.get("/api/users/:id/id", getUserById);

export default router;
