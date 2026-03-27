import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import * as ctrl from "../controllers/documents.controller";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(ctrl.getDocuments));
router.post("/", asyncHandler(ctrl.createDocument));
router.patch("/reorder", asyncHandler(ctrl.reorderDocuments));
router.get("/:id", asyncHandler(ctrl.getDocument));
router.patch("/:id", asyncHandler(ctrl.updateDocument));
router.put("/:id/content", asyncHandler(ctrl.updateDocumentContent));
router.delete("/:id", asyncHandler(ctrl.deleteDocument));

export default router;
