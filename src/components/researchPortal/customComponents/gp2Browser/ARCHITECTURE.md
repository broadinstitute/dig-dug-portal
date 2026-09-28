# GP2 Browser — architecture

Technical overview of **GP2 Browser** in dig-dug-portal. For UI conventions, see [`DESIGN.md`](./DESIGN.md).

## Shared implementation

GP2 Browser is a thin shell (`../GP2Browser.vue`) that **reuses the KP Variant Sifter component and module tree** under [`../kpVariantSifter/`](../kpVariantSifter/).

This folder keeps GP2-specific notes only. Do not duplicate identical runtime files here.

When a GP2 change needs a forked module or component, add **only that file** under `gp2Browser/` and import it from `GP2Browser.vue`; leave shared code in `kpVariantSifter/`.

For system structure, session model, data flow, and assistant runtime, see [`../kpVariantSifter/ARCHITECTURE.md`](../kpVariantSifter/ARCHITECTURE.md).

## Entry points

| Surface | Path |
|---------|------|
| Shell component | `../GP2Browser.vue` |
| Research section registration | `ResearchSectionComponents.vue` → `"GP2Browser"` |
| Standalone page | `/gp2browser.html` (`src/views/GP2Browser/`) |
