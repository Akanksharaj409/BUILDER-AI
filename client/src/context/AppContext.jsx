import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";

export const AppContext = createContext(undefined);

export function AppContextProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [activeProject, setActiveProject] = useState(null);
    const [loadingActiveProject, setLoadingActiveProject] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [generatingProject, setGeneratingProject] = useState(false);
    const [activeFile, setActiveFile] = useState("/App.js");
    const [showCode, setShowCode] = useState(false);

    const checkSession = useCallback(async () => {
        try {
            const { data } = await api.get("/api/auth/me");
            setUser(data.user);
        } catch (_err) {
            setUser(null);
        } finally {
            setLoadingUser(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = async (email, password) => {
        try {
            const { data } = await api.post("/api/auth/login", { email, password });
            setUser(data.user);
            toast.success("Login successful");
            navigate("/");
        } catch (err) {
            console.error("Login failed", err);
            const errMsg = err?.response?.data?.error || err?.message || "Invalid email or password";
            toast.error(errMsg);
            throw new Error(errMsg);
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post("/api/auth/register", { name, email, password });
            setUser(data.user);
            toast.success("Registration successful");
            navigate("/");
        } catch (err) {
            console.error("Registration failed", err);
            const errMsg = err?.response?.data?.error || err?.message || "Registration failed";
            toast.error(errMsg);
            throw new Error(errMsg);
        }
    };

    const logout = async () => {
        try {
            await api.post("/api/auth/logout");
            setUser(null);
            setProjects([]);
            setActiveProject(null);
            toast.success("Logout successful");
            navigate("/login");
        } catch (err) {
            console.error("Logout failed", err);
            const errMsg = err?.response?.data?.error || "Logout failed";
            toast.error(errMsg);
            throw new Error(errMsg);
        }
    };

    // Projects Actions
    const loadProjects = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await api.get("/api/projects");
            const list = Array.isArray(data) ? data : data?.projects || [];
            setProjects(list);
        } catch (err) {
            console.error("Failed to load projects", err);
            toast.error("Failed to load projects");
        } finally {
            setLoadingProjects(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadProjects();
        }
    }, [user, loadProjects]);

    const loadProject = useCallback(async (id, silent = false) => {
        if (!user) return;
        if (!silent) setLoadingActiveProject(true);
        try {
            const { data } = await api.get(`/api/projects/${id}`);
            const proj = data.project || data;
            setActiveProject(proj);
            const files = Object.keys(data.files || proj.files || {});
            if (files.length > 0) {
                setActiveFile((prev) => {
                    if (files.includes(prev)) return prev;
                    if (files.includes("App.js")) return "App.js";
                    return files[0];
                });
            }
        } catch (err) {
            console.error("Failed to load project", err);
            if (!silent) {
                toast.error("Failed to load project");
                navigate("/");
            }
        } finally {
            if (!silent) setLoadingActiveProject(false);
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!activeProject?._id || !user) return;

        const isOngoing =
            activeProject?.status === "generating" ||
            activeProject?.status === "revising" ||
            activeProject?.status === "pending";

        if (isOngoing) {
            setChatLoading(true);
            const interval = setInterval(async () => {
                loadProject(activeProject?._id, true);
            }, 2000);
            return () => {
                clearInterval(interval);
            };
        } else {
            setChatLoading(false);
        }
    }, [activeProject?._id, activeProject?.status, loadProject, user]);

    const handleGenerate = useCallback(
        async (prompt) => {
            if (!user) return;
            setGeneratingProject(true);
            try {
                let res;
                try {
                    res = await api.post("/api/projects/generate", { prompt });
                } catch (firstErr) {
                    if (firstErr?.response?.status === 404) {
                        res = await api.post("/api/projects", { prompt });
                    } else {
                        throw firstErr;
                    }
                }
                const data = res.data;
                const proj = data.project || data;
                navigate(`/builder/${proj._id}`);
            } catch (err) {
                console.error("Failed to generate project", err);
                toast.error(err?.response?.data?.error || "Failed to generate project");
            } finally {
                setGeneratingProject(false);
            }
        },
        [navigate, user]
    );

    const handleDelete = useCallback(
        async (id) => {
            if (!user) return;
            try {
                await api.delete(`/api/projects/${id}`);
                setProjects((prev) => prev.filter((project) => project._id !== id));
                toast.success("Project deleted");
            } catch (err) {
                console.error("Failed to delete project", err);
                toast.error("Failed to delete project");
            }
        },
        [user]
    );

    const handleChat = useCallback(
        async (prompt) => {
            if (!activeProject || !user) return;
            setChatLoading(true);
            try {
                const { data } = await api.post(`/api/projects/${activeProject._id}/chat`, { prompt });
                const updated = data.project || data;
                setActiveProject(updated);
                if (data.errors && data.errors.length > 0) {
                    toast.error(`${data.errors.length} revision patches failed`);
                } else {
                    toast.success(`Updated to version ${updated.version || 1}`);
                }
            } catch (error) {
                console.error("Revision request failed", error);
                toast.error("Failed to update");
            } finally {
                setChatLoading(false);
            }
        },
        [activeProject, user]
    );

    const debouncedSave = React.useMemo(
        () =>
            debounce(async (files, id) => {
                try {
                    const { data } = await api.put(`/api/projects/${id}/files`, { files });
                    const updated = data.project || data;
                    if (updated?.files) {
                        setActiveProject((prev) => {
                            if (!prev || prev._id !== id) return prev;
                            return { ...prev, files: updated.files };
                        });
                    }
                } catch (error) {
                    console.error("Failed to save files", error);
                    toast.error("Failed to save files");
                }
            }, 1000),
        []
    );

    useEffect(() => {
        return () => {
            debouncedSave.flush();
        };
    }, [debouncedSave]);

    const updateProjectFiles = useCallback(
        (files) => {
            if (!activeProject || !user) return;
            if (activeProject.status === "generating" || activeProject.status === "pending") return;
            // Instantly update activeProject in React state so all UI components update live
            setActiveProject((prev) => {
                if (!prev) return prev;
                return { ...prev, files };
            });
            debouncedSave(files, activeProject._id);
        },
        [activeProject, user, debouncedSave]
    );

    const flushSave = useCallback(async () => {
        await debouncedSave.flush();
    }, [debouncedSave]);

    return (
        <AppContext.Provider
            value={{
                user,
                loadingUser,
                error,
                setUser,
                setError,
                login,
                register,
                loadingProjects,
                projects,
                loadingActiveProject,
                activeProject,
                chatLoading,
                showCode,
                setShowCode,
                activeFile,
                setActiveFile,
                loadProjects,
                loadProject,
                handleGenerate,
                generatingProject,
                handleDelete,
                logout,
                handleChat,
                updateProjectFiles,
                flushSave,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppContextProvider");
    }
    return context;
}