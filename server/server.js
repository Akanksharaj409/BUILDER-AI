import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectToDatBase } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import projectRouter from "./routes/ProjectRoutes.js";

const app = express();

// Trust reverse proxy (required for Render / Heroku / Vercel HTTPS cookies)
app.set("trust proxy", 1);

await connectToDatBase();

const rawOrigins = process.env.ORIGINS
    ? process.env.ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:3000"];

const allowedOrigins = rawOrigins.map((o) => o.trim().replace(/\/$/, ""));

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const cleanOrigin = origin.trim().replace(/\/$/, "");
            if (
                allowedOrigins.includes(cleanOrigin) ||
                allowedOrigins.includes("*") ||
                cleanOrigin.endsWith(".vercel.app")
            ) {
                return callback(null, true);
            }
            console.warn(`[CORS Warning] Request from origin ${origin} allowed`);
            return callback(null, true);
        },
        credentials: true,
    })
);

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/project", projectRouter);

// Centralized error handler
app.use((err, req, res, _next) => {
    console.error(`[Server Error] ${err.message}`, err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});