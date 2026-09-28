# GP2 Browser — design rules

GP2 Browser reuses KP Variant Sifter runtime code under [`../kpVariantSifter/`](../kpVariantSifter/). Prefer changing shared files there unless a GP2-only fork is required.

General UI conventions: [`../kpVariantSifter/DESIGN.md`](../kpVariantSifter/DESIGN.md).  
Architecture notes: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## GP2 shell differences

- **Entry:** `../GP2Browser.vue` (research section `GP2Browser`; standalone `/gp2browser.html`)
- **Brand:** GP2 mark + “Browser”; welcome title “Welcome to GP2 Browser”
- **Settings → Information:** `toolName="GP2 Browser"`
- **Page chrome:** GP2 project header on `/gp2browser.html` (no portal PageHeader / PageFooter)
- **LLM:** shared Variant Sifter GE relevance path uses Bedrock (`@/utils/llmClient` → `https://llm.hugeamp.org/bedrock`)

Visualizer / track conventions for agents also live in `.cursor/rules/kp-variant-sifter-visualizers.mdc` when present in the workspace.
