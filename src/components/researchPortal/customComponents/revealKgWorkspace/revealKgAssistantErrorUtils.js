/** Sanitize API / server errors for canvas assistant UI. */

function stripHtml(text) {
    return String(text || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;|&lt;|&gt;|&amp;|&#\d+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function firstMeaningfulLine(text) {
    const lines = String(text || "")
        .split(/[\n\r]+/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (!lines.length) {
        return "";
    }
    for (const line of lines) {
        if (!/^\s*at\s+/i.test(line) && !line.includes("node_modules")) {
            return line;
        }
    }
    return lines[0];
}

export function sanitizeAssistantError(error) {
    let message = stripHtml(error?.message || error || "Canvas assistant step failed.");
    if (!message) {
        message = "Canvas assistant step failed.";
    }
    if (/PayloadTooLargeError|request entity too large/i.test(message)) {
        return "The request was too large. Try explaining or expanding with fewer nodes.";
    }
    if (message.includes("node_modules") || message.length > 280) {
        message = firstMeaningfulLine(message) || message.slice(0, 277);
    }
    if (message.length > 280) {
        message = `${message.slice(0, 277)}…`;
    }
    return message;
}
