import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createProject, listProject, getProject, deleteProject, updateProjectFiles, publishProject, getPublishProject } from "../controllers/ProjectController.js";
import { chat } from "../controllers/ChatController.js";

const projectRouter = Router();

// Public Route
projectRouter.get("/public/:id", getPublishProject);

// Protect all following routes
projectRouter.use(authMiddleware);

projectRouter.post("/", createProject);
projectRouter.post("/generate", createProject);
projectRouter.get("/", listProject);
projectRouter.delete("/:id", deleteProject);
projectRouter.get("/:id", getProject);
projectRouter.put("/:id/files", updateProjectFiles);
projectRouter.put("/:id/publish", publishProject);
projectRouter.post("/:id/publish", publishProject);

// Chat / Revision
projectRouter.post("/:id/chat", chat);

export default projectRouter;