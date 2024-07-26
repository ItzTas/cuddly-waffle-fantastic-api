import { Router } from "express";
import {
  handlerCreateUser,
  handlerGetUserById,
} from "../controllers/users_controlers.js";

const router = Router();

router.post("/api/users/accounts", handlerCreateUser);
router.get("/api/users/:id/id", handlerGetUserById);

export default router;
