import { Router } from "express";
import {
  handlerCreateUser,
  handlerGetAllUsers,
  handlerGetUserById,
  handlerUpdateAllUserInfosById,
} from "../controllers/users_controllers.js";

const router = Router();

router.post("/api/users/accounts", handlerCreateUser);
router.get("/api/users", handlerGetAllUsers);
router.get("/api/users/:id/id", handlerGetUserById);
router.patch("/api/users/:id/id", handlerUpdateAllUserInfosById);

export default router;
