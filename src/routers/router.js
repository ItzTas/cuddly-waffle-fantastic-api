import { Router } from "express";
import {
  handlerCreateUser,
  handlerGetAllUsers,
  handlerGetUserById,
  handlerGetUserByEmail,
  handlerUpdateAllUserInfosById,
} from "../controllers/users_controllers.js";

const router = Router();

router.post("/api/users/accounts", handlerCreateUser);
router.get("/api/users", handlerGetAllUsers);
router.get("/api/users/:id/id", handlerGetUserById);
router.get("/api/users/:email/email", handlerGetUserByEmail);
router.patch("/api/users/:id/id", handlerUpdateAllUserInfosById);

export default router;
