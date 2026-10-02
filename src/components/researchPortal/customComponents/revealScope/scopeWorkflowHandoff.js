/**
 * "Develop idea to a hypothesis" — opens REVEAL Workflow (hybridSearchReveal)
 * with SCOPE user input as the free-text `query` param.
 *
 * hybridSearchReveal currently only reads keyParams.query on mount; phenotype /
 * mechanism / genes / research_context are extracted inside that app. Prefill of
 * those fields is a later handoff step.
 *
 * Prefer /r/<pageid> via kcURL() (same pattern as DESIGN / CANVAS handoffs).
 */
import { kcURL } from "@/utils/cfdeUtils";

export const WORKFLOW_PAGE_PATH = "/r/hybrid_search_reveal";

/**
 * @param {{ hypothesisText?: string }} params
 * @returns {string} environment-appropriate URL for window.open
 */
export function buildWorkflowHandoffUrl({ hypothesisText } = {}) {
    const query = typeof hypothesisText === "string" ? hypothesisText.trim() : "";
    const params = new URLSearchParams();
    if (query) {
        params.set("query", query);
    }
    const qs = params.toString();
    return kcURL(qs ? `${WORKFLOW_PAGE_PATH}?${qs}` : WORKFLOW_PAGE_PATH);
}
