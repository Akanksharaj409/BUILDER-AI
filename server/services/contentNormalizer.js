// Fix double-escaped newlines/quotes from AI JSON string output
export function normalizeContent(content) {
    if (!content || typeof content !== "string") return "";

    // Remove BOM if present
    if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
    }

    // Normalize \r\n to \n
    content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const realNewlines = (content.match(/\n/g) || []).length;
    const literalBackslashN = (content.match(/\\n/g) || []).length;

    if (literalBackslashN > 0 && realNewlines < 3) {
        try {
            if (content.startsWith('"') && content.endsWith('"')) {
                content = JSON.parse(content);
            } else {
                content = content
                    .replace(/\\n/g, () => "\n")
                    .replace(/\\t/g, () => "\t")
                    .replace(/\\r/g, () => "");
            }
        } catch (_e) {
            content = content.replace(/\\n/g, () => "\n");
        }
    }

    // Always clean up backslash-escaped quotes (e.g. className=\"relative\") in code.
    content = content.replace(/(\w+)=\\"([^"]*?)\\"/g, '$1="$2"');

    // Clean up HTML paragraph line breaks injected by AI models (e.g. </p><p> → \n)
    if (content.includes("</p><p>")) {
        content = content.replace(/<\/p><p>/g, () => "\n");
    }

    // Strip leading/trailing paragraph tags wrapping code
    content = content.replace(/^<p>(?=\s*(?:import|export|const|let|var|function|class|return|\/\*|\/\/|@import|@keyframes|body|html|<))/i, "");
    content = content.replace(/(?:;|\}|>)\s*<\/p>$/i, (match) => match.replace(/<\/p>$/, ""));

    // Clean HTML entities if model returned escaped characters
    if (content.includes("&lt;") || content.includes("&gt;") || content.includes("&amp;")) {
        content = content
            .replace(/&lt;/g, () => "<")
            .replace(/&gt;/g, () => ">")
            .replace(/&quot;/g, () => '"')
            .replace(/&#39;/g, () => "'")
            .replace(/&amp;/g, () => "&");
    }

    return content;
}
