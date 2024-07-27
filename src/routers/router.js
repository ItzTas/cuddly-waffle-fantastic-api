import { Router } from "express";
import {
  handlerCreateUser,
  handlerGetAllUsers,
  handlerGetUserById,
  handlerGetUserByEmail,
  handlerUpdateAllUserInfosById,
  handlerUpdateUserPasswordById,
} from "../controllers/users_controllers.js";

const router = Router();

router.post("/api/users/accounts", handlerCreateUser);
router.get("/api/users", handlerGetAllUsers);
router.get("/api/users/:id/id", handlerGetUserById);
router.get("/api/users/:email/email", handlerGetUserByEmail);
router.patch("/api/users/:id/id", handlerUpdateAllUserInfosById);
router.patch("/api/users/password/:id/id", handlerUpdateUserPasswordById);

export default router;
