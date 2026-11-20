/**
 * GP2 Browser assistant action catalog: the shared Variant Sifter catalog,
 * remapped for GP2 Browser naming, plus GP2-only actions layered on top.
 * Shared file (`kpVariantSifter/variantSifterAssistantActionCatalog.js`) is
 * never modified — see gp2Browser/AGENTS.md.
 */
import {
    VKS_ASSISTANT_ACTION_CATALOG_SECTIONS,
    findAssistantAction,
} from "../kpVariantSifter/variantSifterAssistantActionCatalog.js";

export const GP2_AI_SUMMARY_ACTION_ID = "generate_ai_summary";

const GP2_AI_SUMMARY_ACTION = {
    id: GP2_AI_SUMMARY_ACTION_ID,
    label: "Generate AI summary",
    description:
        "Optional. Summarize the lead GWAS signal in this locus and relate it to cortical QTL evidence using pairwise LD to the lead variant (no credible sets/fine-mapping available). Uses only already-loaded Associations and QTL evidences data; notes when LD scores aren't available instead of generating an ungrounded summary.",
    runnable: true,
    autoOnSearch: false,
    examples: ["Generate an AI summary", "Summarize this locus", "Generate a locus summary"],
};

export const GP2_LITERATURE_EVIDENCE_ACTION_ID = "generate_literature_evidence";

const GP2_LITERATURE_EVIDENCE_ACTION = {
    id: GP2_LITERATURE_EVIDENCE_ACTION_ID,
    label: "Generate literature evidence",
    description:
        "Optional. Runs in two visible stages: first Generate AI summary (locus findings from Associations/LD/QTL), then searches PubMed for those genes and the phenotype and summarizes evidences / open questions in the Literature evidence panel.",
    runnable: true,
    autoOnSearch: false,
    examples: [
        "Generate literature evidence",
        "Search the literature for this locus",
        "Find papers about these genes",
    ],
};

function remapSectionForGp2(section) {
    return {
        ...section,
        intro: String(section.intro || "").replace(/Variant Sifter/gi, "GP2 Browser"),
        groups: (section.groups || []).map((group) => ({
            ...group,
            actions: (group.actions || []).map((action) => ({
                ...action,
                description: String(action.description || "").replace(
                    /Variant Sifter/gi,
                    "GP2 Browser"
                ),
            })),
        })),
    };
}

export const GP2_ASSISTANT_ACTION_CATALOG_SECTIONS = VKS_ASSISTANT_ACTION_CATALOG_SECTIONS.map(
    (section) => {
        const base = remapSectionForGp2(section);
        if (section.section !== "Research") {
            return base;
        }
        return {
            ...base,
            groups: [
                ...base.groups,
                {
                    group: "AI summary",
                    actions: [GP2_AI_SUMMARY_ACTION],
                },
                {
                    group: "Literature evidence",
                    actions: [GP2_LITERATURE_EVIDENCE_ACTION],
                },
            ],
        };
    }
);

/** Flat list of every GP2 Browser assistant action, GP2-only ones included. */
export function listGp2AssistantActions() {
    const actions = [];
    GP2_ASSISTANT_ACTION_CATALOG_SECTIONS.forEach((section) => {
        (section.groups || []).forEach((group) => {
            (group.actions || []).forEach((action) => {
                actions.push({ ...action, section: section.section, group: group.group });
            });
        });
    });
    return actions;
}

/** Like `findAssistantAction`, but also resolves GP2-only actions. */
export function gp2FindAssistantAction(actionId) {
    if (actionId === GP2_AI_SUMMARY_ACTION_ID) {
        return { ...GP2_AI_SUMMARY_ACTION, section: "Research", group: "AI summary" };
    }
    if (actionId === GP2_LITERATURE_EVIDENCE_ACTION_ID) {
        return {
            ...GP2_LITERATURE_EVIDENCE_ACTION,
            section: "Research",
            group: "Literature evidence",
        };
    }
    return findAssistantAction(actionId);
}
