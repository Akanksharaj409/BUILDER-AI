import { Schema, model } from "mongoose";

const MessageSchema = new Schema({
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false })

const PlannedFileSchema = new Schema({
    path:{type:String,required:true},
    description:{type:String,required:true},
}, { _id: false })

const ProjectSchema = new Schema({
    name: { required: true, type: String, default: "Untitled Project" },
    description: { type: String, default: "" },
    files: { type: Schema.Types.Mixed, default: {} },
    messages: { type: [MessageSchema], default: [] },
    version: { type: Number, default: 0 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "generating", "revising", "completed", "failed"], default: "pending" },
    filesPlanned: { type: [PlannedFileSchema], default: [] },
    filesGenerated: { type: [String], default: [] },
    currentFile: { type: String, default: null },
    error: { type: String, default: null },
    published: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    publishAt: { type: Date, default: null }
}, { timestamps: true })

export const Project = model("Project", ProjectSchema);