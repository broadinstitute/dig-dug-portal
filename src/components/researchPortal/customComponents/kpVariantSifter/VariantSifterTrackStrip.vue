<template>
    <section class="vks-track" :aria-label="section.label">
        <header class="vks-track-head">
            <h3 class="vks-track-title">{{ section.label }}</h3>
        </header>
        <div class="vks-track-body" :style="trackBodyStyle">
            <div class="vks-track-placeholder">
                <span class="vks-track-placeholder-mark">{{ section.shortLabel }}</span>
                <p class="vks-track-placeholder-text">
                    {{ section.label }} visualizer will render here.
                </p>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    name: "VariantSifterTrackStrip",
    props: {
        section: {
            type: Object,
            required: true,
        },
    },
    computed: {
        trackBodyStyle() {
            return {
                minHeight: "120px",
            };
        },
    },
};
</script>

<style scoped>
.vks-track {
    background: #ffffff;
}

.vks-track-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
}

.vks-track-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.vks-track-body {
    position: relative;
    overflow: hidden;
    background:
        radial-gradient(circle at 1px 1px, rgba(20, 22, 30, 0.06) 1px, transparent 0);
    background-size: 22px 22px;
    background-color: var(--cfde-bg, #f6f5f2);
}

.vks-track-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: inherit;
    padding: 20px;
    text-align: center;
}

.vks-track-placeholder-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--cfde-orange, #e07b39);
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.02em;
    margin-bottom: 8px;
}

.vks-track-placeholder-text {
    margin: 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
