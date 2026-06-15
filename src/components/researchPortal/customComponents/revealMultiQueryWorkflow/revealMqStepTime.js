/**
 * Step elapsed-time formatting for Multi Query REVEAL workflow UI.
 */

function formatStepElapsedMs(ms) {
    if (!ms) return null;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (seconds < 0) return null;
    return `${String(minutes)}m${String(seconds).padStart(2, "0")}s`;
}

function formatLiveStepTime(step, now = Date.now()) {
    if (!step || step.timeStart == null) return null;
    return formatStepElapsedMs(now - step.timeStart);
}

function formatStepTimeLabel(step, now = Date.now()) {
    if (!step) return "";
    return formatStepElapsedMs(step.time) || formatLiveStepTime(step, now) || "";
}

export {
    formatLiveStepTime,
    formatStepElapsedMs,
    formatStepTimeLabel,
};
