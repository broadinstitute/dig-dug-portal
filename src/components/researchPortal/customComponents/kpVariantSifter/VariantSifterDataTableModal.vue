<template>
    <div
        v-if="open"
        class="vks-data-table-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vks-data-table-title"
        @click.self="$emit('close')"
    >
        <div class="vks-data-table-panel">
            <header class="vks-data-table-head">
                <h2 id="vks-data-table-title">Variant data table</h2>
                <button
                    type="button"
                    class="vks-data-table-close"
                    aria-label="Close data table"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </header>
            <div class="vks-data-table-body">
                <p class="vks-data-table-note">
                    Cross-mapped variant rows from all active section filters will
                    appear here.
                </p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "VariantSifterDataTableModal",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style scoped>
.vks-data-table-modal {
    position: absolute;
    inset: 0;
    z-index: 8;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 12px;
    background: rgba(20, 22, 30, 0.28);
}

.vks-data-table-panel {
    width: min(960px, 100%);
    max-height: 55%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 12px 12px 8px 8px;
    box-shadow: 0 12px 40px rgba(20, 22, 30, 0.18);
    overflow: hidden;
}

.vks-data-table-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.vks-data-table-head h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-data-table-close {
    border: none;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
    padding: 0 4px;
}

.vks-data-table-body {
    overflow: auto;
    padding: 14px 16px 18px;
}

.vks-data-table-note {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
