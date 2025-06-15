import express  from "express";
import * as sessionController from "../controllers/session.controller";

const router = express.Router();

router.get("/", sessionController.list);
router.post("/create", sessionController.create);
router.get("/:id", sessionController.getOne);
router.put("/:id", sessionController.update);
router.delete("/:id", sessionController.remove);

export default router;
