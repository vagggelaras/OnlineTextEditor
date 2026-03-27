import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import * as ctrl from "../controllers/folders.controller";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(ctrl.getFolders));
router.post("/", asyncHandler(ctrl.createFolder));
router.patch("/reorder", asyncHandler(ctrl.reorderFolders));
router.patch("/:id", asyncHandler(ctrl.updateFolder));
router.delete("/:id", asyncHandler(ctrl.deleteFolder));

export default router;
