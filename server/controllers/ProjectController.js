import { Project } from "../models/Project.js";
import crypto from "crypto";
import { generateProject } from "../services/ai.js";

function hashContent(content) {
    return crypto.createHash("md5").update(content).digest("hex").slice(0, 12);
}

// POST /api/projects
// Create a new project from an AI prompt.
export async function createProject(req, res) {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "valid project prompt is required" });
    }
    if (!req.user) {
        return res.status(401).json({ error: "unauthorized" });
    }
    // Create project in DB immediately with "pending" status
    const project = await Project.create({
        name: "planning project...",
        description: prompt,
        files: {},
        messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: "planning project structure..." }
        ],
        version: 0,
        owner: req.user.userId,
        status: "pending",
        filesPlanned: [],
        filesGenerated: [],
        currentFile: null,
        error: null,
    });
    // Start background generation
    runBackgroundGeneration(project._id.toString(), prompt).catch((err) => {
        console.error(`[Background AI] Fatal generation error for project ${project._id}:`, err);
    });
    res.status(201).json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: {},
        messages: project.messages,
        version: project.version,
        status: project.status,
        filesPlanned: project.filesPlanned,
        filesGenerated: project.filesGenerated,
        currentFile: project.currentFile,
        error: project.error,
        createdAt: project.createdAt,
    });
}

// Background worker to progressively generate files and update database in real-time
async function runBackgroundGeneration(projectId, prompt) {
    try {
        console.log(`[Background AI] Starting generation for project ${projectId}`);
        const result = await generateProject(prompt, {
            onPlan: async (plan) => {
                console.log(`[Background AI] Plan generated for project ${projectId}. Planned ${plan.files.length} files`);
                const fileList = plan.files.map((f) => `-\`${f.path}\`:${f.description}`).join('\n');

                await Project.findByIdAndUpdate(projectId, {
                    name: plan.projectName || "generated Project",
                    status: "generating",
                    filesPlanned: plan.files,
                    $push: {
                        messages: {
                            role: "assistant",
                            content: `Planned website structure:\n${fileList}`,
                            timestamp: new Date(),
                        }
                    }
                });
            },
            onFileStart: async (path) => {
                console.log(`[Background AI] Starting file ${path} for project ${projectId}`);
                await Project.findByIdAndUpdate(projectId, {
                    currentFile: path,
                });
            },
            onFileComplete: async (path, code) => {
                console.log(`[Background AI] FINISHED FILE ${path} FOR PROJECT ${projectId}`);

                const project = await Project.findById(projectId);
                if (project) {
                    project.files = project.files || {};
                    project.files[path] = { content: code, hash: hashContent(code) };
                    project.filesGenerated = [...(project.filesGenerated || []), path];
                    project.messages.push({
                        role: "assistant",
                        content: `Generated file:${path}`,
                        timestamp: new Date()
                    });
                    project.currentFile = null;
                    project.markModified('files');
                    await project.save();
                }
            }
        });
        console.log(`[Background AI] Successfully generated project ${projectId}`);
        const project = await Project.findById(projectId);
        if (project) {
            project.status = "completed";
            project.version = 1;
            if (result.description) {
                project.name = result.description;
            }
            project.messages.push({
                role: "assistant",
                content: `Website generation complete! You can view and edit the files`,
                timestamp: new Date()
            });
            await project.save();
        }
    } catch (error) {
        console.error(`[Background AI] Background generation failed for project ${projectId}:${error}`);
        await Project.findByIdAndUpdate(projectId, {
            status: "failed",
            error: error.message,
            $push: {
                messages: {
                    role: "assistant",
                    content: `Background generation failed ${error.message}`,
                    timestamp: new Date()
                }
            }
        });
    }
}

// GET /api/projects
// List all projects owned by the user (summary only, no file contents).
export async function listProject(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const projects = await Project.find(
        { owner: req.user.userId },
        { name: 1, description: 1, version: 1, status: 1, createdAt: 1, updatedAt: 1 }
    ).sort({ updatedAt: -1 });
    res.json(projects);
}

// GET /api/projects/:id
// GET full project details.
export async function getProject(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });

    if (!project) {
        return res.status(404).json({ error: "Project not found" });
    }
    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files || {})) {
        filesObj[path] = entry.content;
    }
    res.json({
        id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        messages: project.messages,
        version: project.version,
        status: project.status,
        filesPlanned: project.filesPlanned,
        filesGenerated: project.filesGenerated,
        currentFile: project.currentFile,
        error: project.error,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    });
}

// DELETE /api/projects/:id
// Delete a project.
export async function deleteProject(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await Project.findOneAndDelete({
        _id: req.params.id,
        owner: req.user.userId
    });
    if (!result) {
        return res.status(404).json({ error: "Project not found" });
    }
    res.json({ success: true });
}

// PUT /api/projects/:id/files
// Update project files (manual edits)
export async function updateProjectFiles(req, res) {
    const { files } = req.body;
    if (!files || typeof files !== 'object') {
        return res.status(400).json({ error: "files object is required" });
    }
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });
    if (!project) {
        return res.status(404).json({ error: "Project not found" });
    }

    // Rebuild project files map with content & hashes
    const newFiles = {};
    for (const [path, content] of Object.entries(files)) {
        if (typeof content === 'string') {
            newFiles[path] = { content, hash: hashContent(content) };
        }
    }
    project.files = newFiles;
    await project.save();

    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files)) {
        filesObj[path] = entry.content;
    }
    res.json({
        id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        messages: project.messages,
        version: project.version,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    });
}

// POST /api/projects/:id/publish
// Mark a project as publicly published.
export async function publishProject(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const project = await Project.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.userId },
        { published: true, isPublic: true, publishAt: new Date() },
        { new: true }
    );
    if (!project) {
        return res.status(404).json({ error: "Project not found" });
    }

    res.json({ id: project._id, isPublic: project.isPublic, published: project.published, publishAt: project.publishAt });
}

// GET /api/projects/public/:id
// Get a publicly published project details
export async function getPublishProject(req, res) {
    const project = await Project.findById(req.params.id);
    if (!project) {
        return res.status(404).json({ error: "Project not found" });
    }
    if (!project.published && !project.isPublic) {
        return res.status(403).json({ error: "Project not published" });
    }

    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files || {})) {
        filesObj[path] = entry.content;
    }

    res.json({
        id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        version: project.version,
    });
}