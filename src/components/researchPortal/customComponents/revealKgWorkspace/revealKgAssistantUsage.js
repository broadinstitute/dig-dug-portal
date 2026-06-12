/** Persist Canvas Assist LLM token usage (planner calls via llmClient only). */

const STORAGE_KEY = "_reveal_kg_assist_llm_usage";
const MAX_RECENT = 50;
const VERSION = 1;

function defaultState() {
    return {
        version: VERSION,
        totals: {
            calls: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            estimated_calls: 0,
        },
        recent: [],
    };
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return defaultState();
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
            return defaultState();
        }
        return {
            ...defaultState(),
            ...parsed,
            totals: {
                ...defaultState().totals,
                ...(parsed.totals || {}),
            },
            recent: Array.isArray(parsed.recent) ? parsed.recent : [],
        };
    } catch (error) {
        return defaultState();
    }
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        // Quota or private mode — ignore.
    }
}

function coerceCount(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function recordAssistantPlanUsage({
    usage,
    model = null,
    outcome = "plan",
    duration_ms = null,
} = {}) {
    const state = loadState();
    const prompt_tokens = coerceCount(usage?.prompt_tokens);
    const completion_tokens = coerceCount(usage?.completion_tokens);
    const total_tokens =
        coerceCount(usage?.total_tokens) || prompt_tokens + completion_tokens;

    state.totals.calls += 1;
    state.totals.prompt_tokens += prompt_tokens;
    state.totals.completion_tokens += completion_tokens;
    state.totals.total_tokens += total_tokens;
    if (usage?.estimated) {
        state.totals.estimated_calls += 1;
    }

    state.recent.unshift({
        ts: new Date().toISOString(),
        model: model || usage?.model || null,
        operation: "assist_plan",
        outcome,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        estimated: Boolean(usage?.estimated),
        source: usage?.source || null,
        duration_ms:
            duration_ms != null && Number.isFinite(Number(duration_ms))
                ? Math.round(Number(duration_ms))
                : null,
    });
    if (state.recent.length > MAX_RECENT) {
        state.recent.length = MAX_RECENT;
    }

    saveState(state);
    return state;
}

export function getAssistantUsageSummary() {
    const state = loadState();
    return {
        totals: { ...state.totals },
        recent: [...state.recent],
    };
}

export function clearAssistantUsage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // ignore
    }
}
