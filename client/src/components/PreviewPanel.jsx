import React, { useState, useEffect, useRef, useMemo } from "react";
import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from "@codesandbox/sandpack-react";
import { useAppContext } from "../context/AppContext";
import { detectDependencies } from "../utils/sandpackUtils";
import SandpackErrorMonitor from "./SandpackErrorMonitor";

//watches for files edits inside Sandpack editor and saves changes to DB & live state
function SandpackFileWatcher({ onLiveFilesChange }) {
    const { sandpack } = useSandpack();
    const { files } = sandpack;
    const { activeProject, updateProjectFiles } = useAppContext();

    const isInitialMount = useRef(true);
    const activeProjectRef = useRef(activeProject);
    useEffect(() => {
        activeProjectRef.current = activeProject;
    }, [activeProject]);

    useEffect(() => {
        const project = activeProjectRef.current;
        if (!project || !project.files || project.status === "generating" || project.status === "pending") return;

        const updatedFiles = {};
        let hasChanges = false;

        for (const [path, fileObj] of Object.entries(files)) {
            const fileCode = fileObj.code;
            
            // Exclude synthetic entry / html wrapper files from project files payload
            if (path === "/index.js" || path === "index.js" || path === "/public/index.html" || path === "public/index.html") {
                continue;
            }

            updatedFiles[path] = fileCode;

            const altPath = path.startsWith("/") ? path.substring(1) : "/" + path;
            const originalContent = typeof project.files[path] === "string" ? project.files[path] :
                (project.files[path]?.content !== undefined ? project.files[path].content :
                (typeof project.files[altPath] === "string" ? project.files[altPath] : project.files[altPath]?.content));

            let isTailwindPrependOnly = false;
            if ((path === "/styles.css" || path === "styles.css") && originalContent !== undefined) {
                const injected = `@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');\n`;
                if (!originalContent.includes("tailwindcss") && (fileCode === injected + originalContent || fileCode.trim() === (injected + originalContent).trim())) {
                    isTailwindPrependOnly = true;
                }
            }

            if (originalContent !== undefined && originalContent.trim() !== fileCode.trim() && !isTailwindPrependOnly) {
                hasChanges = true;
            }
        }

        // Sync live files to parent
        if (onLiveFilesChange) onLiveFilesChange(updatedFiles);

        // Skip DB save on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (hasChanges && updateProjectFiles) {
            updateProjectFiles(updatedFiles);
        }
    }, [files, onLiveFilesChange, updateProjectFiles]);
    return null;
}

const PreviewPanel = ({ project, activeFile, showCode }) => {
    const [showErrorOverlay, setShowErrorOverlay] = useState(true);
    // keep local states of files that updates as user types
    const [liveFiles, setLiveFiles] = useState(project?.files || {});
    const [prevProjectKey, setPrevProjectKey] = useState(`${project?._id}-${project?.version}`);

    const currentKey = `${project?._id}-${project?.version}`;

    if (prevProjectKey !== currentKey) {
        setPrevProjectKey(currentKey);
        setLiveFiles(project?.files || {});
    }

    const handleFilesChange = (newFiles) => {
        setLiveFiles((prev) => {
            let changed = false;
            for (const [p, code] of Object.entries(newFiles)) {
                if (prev[p] !== code) {
                    changed = true;
                    break;
                }
            }
            return changed ? newFiles : prev;
        })
    }

    //convert files to sandpack format
    const sandpackFiles = useMemo(() => {
        const spFiles = {};
        for (const [path, content] of Object.entries(liveFiles)) {
            const fileCode = typeof content === "string" ? content : content?.content || "";
            const cleanPath = path.startsWith("/") ? path : "/" + path;
            spFiles[cleanPath] = {
                code: fileCode,
                active: cleanPath === (activeFile?.startsWith("/") ? activeFile : "/" + activeFile),
            };
        }

        // Ensure styles.css has Tailwind CSS stylesheet imported
        if (spFiles["/styles.css"]) {
            let existingCode = spFiles["/styles.css"].code || "";
            // Clean stray fence markers or conversational preambles
            existingCode = existingCode.replace(/^```[a-zA-Z0-9_-]*\s*$/gm, "").trim();
            const firstCssIdx = existingCode.search(/(?:\/\*|@import|@keyframes|@media|@font-face|:root|html|body|[*a-zA-Z0-9_#.-]+\s*\{)/);
            if (firstCssIdx > 0) {
                existingCode = existingCode.slice(firstCssIdx);
            }
            if (!existingCode.includes("tailwindcss")) {
                spFiles["/styles.css"].code = `@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');\n` + existingCode;
            } else {
                spFiles["/styles.css"].code = existingCode;
            }
        } else {
            spFiles["/styles.css"] = {
                code: `@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');\nbody { font-family: sans-serif; }`,
            };
        }

        if (!spFiles["/index.js"] && !spFiles["/src/index.js"]) {
            spFiles["/index.js"] = {
                code: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
            };
        }

        if (!spFiles["/public/index.html"] && !spFiles["/index.html"]) {
            spFiles["/public/index.html"] = {
                code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
            };
        }
        return spFiles;
    }, [liveFiles, activeFile])

    //detect dependencies from import statements using liveFiles
    const dependencies = useMemo(() => {
        return detectDependencies(liveFiles);
    }, [liveFiles])

    return (
        <div className="h-full w-full">
            <SandpackProvider key={`${project._id}-${project.version}`} template="react"
                files={sandpackFiles}
                customSetup={{ dependencies }}
                options={{
                    bundlerURL: "https://sandpack-bundler.codesandbox.io",
                    initMode: "immediate",
                    recompileMode: "delayed",
                    recompileDelay: 300,
                    bundlerTimeOut: 60000,
                    externalResources: [
                        "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css",
                        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
                    ],
                    classes: {
                        "sp-wrapper": "sp-wrapper",
                        "sp-layout": "sp-layout",
                        "sp-preview": "sp-preview",
                    },
                    loglevel: 0,
                }}
                theme={{
                    colors: {
                        surface1: '#ffffff',
                        surface2: '#f4f4f5',
                        surface3: '#e4e4e7',
                        clickable: '#71717a',
                        base: '#09090b',
                        disabled: "#a1a1aa",
                        hover: "18181b",
                        accent: "18181b",
                        error: "#ef4444",
                        errorSurface: "#fef2f2"
                    },
                    font: {
                        body: "`Urbanist`,system-ui,-apple-system,sans-serif",
                        mono: "`Geist Mono`,ui-monospace,monospace",
                        size: "13px",
                        lineHeight: "1.6",
                    },
                }}>

                <SandpackFileWatcher onLiveFilesChange={handleFilesChange} />
                <SandpackErrorMonitor onErrorChange={setShowErrorOverlay} />
                <SandpackLayout
                    style={{
                        height: "100%",
                        border: "none",
                        borderRadius: "0",
                        background: "transparent",
                    }}>
                    {showCode && (
                        <SandpackCodeEditor showTabs showLineNumbers showInlineErrors wrapContent
                            style={{ height: "100%", flex: 1, minWidth: 0 }} />
                    )}
                    <SandpackPreview showNavigator={false} showRefreshButton
                        showOpenInCodeSandbox={false} showSandpackErrorOverlay={showErrorOverlay}
                        style={{ height: "100%", flex: showCode ? 1 : 2, minWidth: 0 }} />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    )
};

export default PreviewPanel;