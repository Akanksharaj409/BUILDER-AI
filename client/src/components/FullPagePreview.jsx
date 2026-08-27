import React, { useMemo, useState } from "react";
import { SandpackProvider, SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";
import SandpackErrorMonitor from "./SandpackErrorMonitor";
import { detectDependencies } from "../utils/sandpackUtils";

const FullPagePreview = ({ files }) => {
    const [showErrorOverlay, setShowErrorOverlay] = useState(true);

    const sandpackFiles = useMemo(() => {
        if (!files) return {};
        const spFiles = {};
        for (const [path, content] of Object.entries(files)) {
            const fileCode = typeof content === "string" ? content : content?.content || "";
            const cleanPath = path.startsWith("/") ? path : "/" + path;
            spFiles[cleanPath] = {
                code: fileCode,
            };
        }

        // Ensure styles.css has Tailwind CSS stylesheet imported
        if (spFiles["/styles.css"]) {
            const existingCode = spFiles["/styles.css"].code || "";
            if (!existingCode.includes("tailwindcss")) {
                spFiles["/styles.css"].code = `@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');\n` + existingCode;
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
    }, [files]);

    //detect dependencies from import statements using liveFiles
    const dependencies = useMemo(() => {
        if (!files) return {};
        return detectDependencies(files);
    }, [files]);

    return (
        <div className="h-screen w-screen bg-white overflow-hidden">
            <SandpackProvider
                template="react"
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
                    loglevel: 0,
                }}
                className="h-full w-full"
            >
                <SandpackErrorMonitor onErrorChange={setShowErrorOverlay} />
                <SandpackLayout className="h-full w-full border-none! bg-transparent!">
                    <SandpackPreview
                        showNavigator={false}
                        showRefreshButton={false}
                        showOpenInCodeSandbox={false}
                        showSandpackErrorOverlay={showErrorOverlay}
                        className="h-full w-full"
                    />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
};

export default FullPagePreview;