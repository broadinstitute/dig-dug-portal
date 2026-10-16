# GP2 Browser — architecture

Technical overview of **GP2 Browser** in dig-dug-portal. For UI conventions, see [`DESIGN.md`](./DESIGN.md). For agent workflow and pitfalls, see [`AGENTS.md`](./AGENTS.md).

## Shared implementation

GP2 Browser is a thin shell (`../GP2Browser.vue`) that **reuses the KP Variant Sifter component and module tree** under [`../kpVariantSifter/`](../kpVariantSifter/).

This folder keeps GP2-specific notes only. Do not duplicate identical runtime files here.

When a GP2 change touches any module or component shared with KP Variant Sifter or another project, create a new GP2-only file (named `GP2Browser*` / `gp2Browser*`) under `gp2Browser/` and import it from `GP2Browser.vue`; leave the shared file in `kpVariantSifter/` untouched.

For system structure, session model, data flow, and assistant runtime, see [`../kpVariantSifter/ARCHITECTURE.md`](../kpVariantSifter/ARCHITECTURE.md).

## Entry points

| Surface | Path |
|---------|------|
| Shell component | `../GP2Browser.vue` |
| GP2 menu bar | `./GP2BrowserMenuBar.vue` |
| Research section registration | `ResearchSectionComponents.vue` → `"GP2Browser"` |
| Standalone page | `/gp2browser.html` (`src/views/GP2Browser/`) |
