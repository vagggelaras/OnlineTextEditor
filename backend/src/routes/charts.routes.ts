import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import * as ctrl from "../controllers/charts.controller";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/", asyncHandler(ctrl.getCharts));
router.post("/", asyncHandler(ctrl.createChart));
router.get("/:id", asyncHandler(ctrl.getChart));
router.patch("/:id", asyncHandler(ctrl.updateChart));
router.delete("/:id", asyncHandler(ctrl.deleteChart));

export default router;
