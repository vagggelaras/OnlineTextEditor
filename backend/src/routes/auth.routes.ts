import { Router } from "express";
import { register, login, logout, getMe, getWsToken } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(getMe));
router.get("/ws-token", requireAuth, asyncHandler(getWsToken));

export default router;
