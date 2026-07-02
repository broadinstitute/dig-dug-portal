/** User-facing catalog of Variant Sifter assistant actions (Actions tab). */

export const VKS_ASSISTANT_ACTION_CATALOG = [
    {
        group: "Global enrichment",
        actions: [
            {
                id: "filter_ge_relevance",
                label: "Filter global enrichment by relevance",
                description:
                    "Ask the LLM which broad tissue categories are most plausible for the searched phenotype and ancestry. Relevant tissues stay emphasized on the GE plot; others are muted (you can turn muted tissues back on in the Global enrich. drawer).",
                runnable: true,
                autoOnSearch: true,
                examples: [
                    "Highlight tissues relevant to type 2 diabetes",
                    "Mute unrelated tissues for this locus",
                ],
            },
        ],
    },
];

export function findAssistantAction(actionId) {
    for (const group of VKS_ASSISTANT_ACTION_CATALOG) {
        const match = group.actions.find((action) => action.id === actionId);
        if (match) {
            return match;
        }
    }
    return null;
}
