import { User } from "../models/User.js";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_CODE_TO_CHANGE_IN_PRODUCTION";

// Helper to set cookie
const setSessionCookie = (res, payload) => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
    return token;
};

export async function register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const trimmedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
        return res.status(400).json({ error: "User already exists" });
    }
    const user = await User.create({
        name,
        email: trimmedEmail,
        password,
    });
    setSessionCookie(res, { userId: user._id.toString(), email: user.email });
    res.status(201).json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email
        },
    });
}

export async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    setSessionCookie(res, { userId: user._id.toString(), email: user.email });

    res.status(200).json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email
        },
    });
}

export async function logout(_req, res) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", "", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 0,
        path: "/",
    });
    res.json({ success: true });
}

export async function me(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
}