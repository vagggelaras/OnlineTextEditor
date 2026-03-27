import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import * as ctrl from "../controllers/shares.controller";

const router = Router({ mergeParams: true });

// Authenticated routes for managing shares
router.get("/", requireAuth, asyncHandler(ctrl.getShares));
router.post("/", requireAuth, asyncHandler(ctrl.createShare));
router.patch("/:id", requireAuth, asyncHandler(ctrl.updateShare));
router.delete("/:id", requireAuth, asyncHandler(ctrl.deleteShare));

export default router;
