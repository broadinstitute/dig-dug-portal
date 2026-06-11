/** Format prior assistant thread + plan for follow-up planner requests. */

export function normalizeConversationTurns(turns = []) {
    if (!Array.isArray(turns)) {
        return [];
    }
    return turns
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => ({
            role: entry.role === "user" ? "user" : "assistant",
            text: String(entry.text || "").trim(),
        }))
        .filter((entry) => entry.text)
        .slice(-12);
}

export function summarizePlanForConversation(plan) {
    if (!plan?.steps?.length) {
        return null;
    }
    const summary = String(plan.summary || "").trim();
    const steps = plan.steps.map((step, index) => {
        const label = String(step.label || step.action || "").trim();
        return `${index + 1}. ${label}`;
    });
    return {
        summary: summary || "Previous plan",
        steps,
    };
}

export function buildConversationPromptSection({ conversation = [], lastPlan = null } = {}) {
    const turns = normalizeConversationTurns(conversation);
    const sections = [];

    if (turns.length > 1) {
        const lines = turns.slice(0, -1).map((turn) => {
            const speaker = turn.role === "user" ? "User" : "Assistant";
            return `${speaker}: ${turn.text}`;
        });
        sections.push(`## Prior conversation\n${lines.join("\n")}`);
    }

    const planSummary = summarizePlanForConversation(lastPlan);
    if (planSummary) {
        sections.push(
            `## Last executed or proposed plan\nSummary: ${planSummary.summary}\nSteps:\n${planSummary.steps.join("\n")}\n\nTreat follow-up requests (e.g. "now explain those", "expand from them") as referring to nodes, filters, or outcomes from this context unless the user names something new.`
        );
    }

    return sections.length ? `${sections.join("\n\n")}\n\n` : "";
}
