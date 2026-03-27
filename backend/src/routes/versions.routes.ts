import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import * as ctrl from "../controllers/versions.controller";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/", asyncHandler(ctrl.getVersions));
router.post("/", asyncHandler(ctrl.createVersion));
router.get("/:id", asyncHandler(ctrl.getVersion));
router.post("/:id/restore", asyncHandler(ctrl.restoreVersion));
router.delete("/:id", asyncHandler(ctrl.deleteVersion));

export default router;
