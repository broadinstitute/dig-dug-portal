<template>
    <section class="vks-workspace-guide" aria-label="Variant Sifter overview">
        <h2 class="vks-workspace-guide-title">Getting around</h2>
        <div class="vks-workspace-guide-grid">
            <div class="vks-workspace-guide-item">
                <h3 class="vks-workspace-guide-label">Header menus</h3>
                <ul class="vks-workspace-guide-list">
                    <li>
                        <strong>Search</strong> — reset the current locus search and return to the
                        start screen.
                    </li>
                    <li>
                        <strong>Import / Export</strong> — save or restore a full session, or download the
                        variant data table.
                    </li>
                    <li>
                        On the right of the header:
                        <strong>Region zoom</strong> expands or focuses the plotted interval;
                        the <strong>table</strong> button opens the variant data table; the
                        <strong>AI</strong> button opens the assistant for guided filtering.
                    </li>
                </ul>
            </div>
            <div class="vks-workspace-guide-item">
                <h3 class="vks-workspace-guide-label">Side drawers</h3>
                <p class="vks-workspace-guide-text">
                    The tabs on the right open a control panel for each analysis section
                    (Associations, Credible sets, Global enrichment, Genes, and others as they
                    become available). Use a drawer to set filters and plot options for that
                    section; the main canvas shows the resulting tracks and visualizations.
                </p>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    name: "VariantSifterWorkspaceGuide",
};
</script>

<style scoped>
.vks-workspace-guide {
    padding: 12px 18px 14px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
    background: #faf9f7;
}

.vks-workspace-guide-title {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-workspace-guide-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 28px;
}

.vks-workspace-guide-label {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.vks-workspace-guide-list {
    margin: 0;
    padding-left: 1.1rem;
    font-size: 13px;
    line-height: 1.45;
    color: #4a4a4a;
}

.vks-workspace-guide-list li + li {
    margin-top: 4px;
}

.vks-workspace-guide-text {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: #4a4a4a;
}

.vks-workspace-guide-list strong,
.vks-workspace-guide-text strong {
    font-weight: 600;
    color: #2f2f2f;
}

@media (max-width: 900px) {
    .vks-workspace-guide-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }
}
</style>
