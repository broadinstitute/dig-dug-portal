# GP2 Browser — design rules

GP2 Browser reuses KP Variant Sifter runtime code under [`../kpVariantSifter/`](../kpVariantSifter/) for unchanged functionality, but **any file that needs GP2-specific changes and is shared with another project must be forked into `gp2Browser/`** (leaving the shared file untouched).

| Doc | Role |
|-----|------|
| [`AGENTS.md`](./AGENTS.md) | How agents should work in this project (entry points, pitfalls, edit map) |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Shared-vs-fork structure and surfaces |
| [`../kpVariantSifter/DESIGN.md`](../kpVariantSifter/DESIGN.md) | Shared workspace UI conventions |

Visualizer / track conventions for agents also live in `.cursor/rules/kp-variant-sifter-visualizers.mdc` when present in the workspace.

---

## Product model

Same canvas-first locus workspace as KP Variant Sifter (search → explore → map; session export; Actions / Settings). GP2 only changes **branding and page chrome**, not the core interaction model.

---

## GP2 shell differences

- **Entry:** `../GP2Browser.vue` (research section `GP2Browser`; standalone `/gp2browser.html`)
- **Brand:** GP2 mark + “Browser”; welcome title “Welcome to GP2 Browser”
- **Menu bar:** `gp2Browser/GP2BrowserMenuBar.vue` — **Session** (`New session`, `Import session`, `Export session`, plus up to 5 recent searches), **Research** (`Gene prioritization`, `Associated phenotypes`, `Literature evidence`), and **Help** (`Getting Around`)
- **Settings → Information:** `toolName="GP2 Browser"`
- **Page chrome:** GP2 project header on `/gp2browser.html` (logo linking to https://gp2.broadinstitute.org/) — no portal `PageHeader` / `PageFooter`
- **LLM:** shared Variant Sifter GE relevance path uses Bedrock (`@/utils/llmClient` → `https://llm.hugeamp.org/bedrock`)

---

## Naming (user-facing)

| Surface | Label |
|---------|--------|
| Drawer tab / section registry | **Gene links** (`id`: `variant-to-gene-links`) |
| Plot section title | Prefer **Gene links** (may still say “Variant-to-gene links” in older shared plot headers — update when touching that UI) |
| Data table mapping group | **Gene links** |
| Data table column | **Gene links** (constant `VKS_V2G_COLUMN`) |
| Mapping chip prefix | Still may use `V2G : …` unless product asks to rename |

Do not rename the internal section id without coordinating session / mapping / settings visibility.

---

## Visual / layout

Follow Variant Sifter DESIGN for drawers, track stack, Actions panel, and Settings tabs. GP2-specific CSS for the standalone header lives in `src/views/GP2Browser/Template.vue` (`.gp2-project-header*`). Keep the first canvas welcome composition consistent with VS; only swap brand strings and chrome.
