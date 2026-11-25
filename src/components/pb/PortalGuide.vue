<template>
    <header class="pb-nav">
        <div class="pb-nav-inner">
            <a class="pb-nav-brand" href="/pb_front2.html" aria-label="CRDC Cohort Explorer home">
                <strong>CRDC</strong><span>Cohort Explorer</span>
            </a>
            <nav aria-label="CRDC browser">
                <a href="/pb_front2.html" :aria-current="current === 'home' ? 'page' : null">Home</a>
                <a :href="guideHref" :target="current === 'guide' ? null : '_blank'"
                   :rel="current === 'guide' ? null : 'noopener'"
                   :aria-label="current === 'guide' ? null : 'Guide (opens in a new tab)'"
                   :aria-current="current === 'guide' ? 'page' : null">
                    Guide<b-icon-arrow-up-right v-if="current !== 'guide'" aria-hidden="true" />
                </a>
                <a href="/pb_sources.html" :aria-current="current === 'sources' ? 'page' : null">Data Sources</a>
            </nav>
        </div>
    </header>
</template>

<script>
import { BIconArrowUpRight } from 'bootstrap-vue';

export default {
    name: 'PortalGuide',
    components: { BIconArrowUpRight },
    props: {
        current: { type: String, default: '' },
        section: { type: String, default: '' },
    },
    computed: {
        guideHref() {
            return this.section ? '/pb_guide.html#' + this.section : '/pb_guide.html';
        },
    },
};
</script>

<style scoped>
.pb-nav {
    position: sticky;
    top: 0;
    z-index: 1020;
    border-bottom: 1px solid #cbd1d4;
    background: #fff;
    color: #202630;
    font: 400 16px/1.35 Arial, sans-serif;
}

.pb-nav-inner {
    width: min(1280px, 89vw);
    min-height: 59px;
    margin-inline: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.pb-nav a {
    color: inherit !important;
    text-decoration: none;
}

.pb-nav a:focus-visible {
    outline: 2px solid #215c9a;
    outline-offset: 3px;
}

.pb-nav-brand {
    display: inline-flex;
    align-items: baseline;
    flex-wrap: wrap;
    column-gap: 22px;
    font: 500 24px/1.15 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    letter-spacing: -.055em;
}

.pb-nav-brand strong { font-size: 27px; font-weight: 800; }
.pb-nav nav { display: flex; align-items: center; gap: clamp(12px, 2.1vw, 32px); }
.pb-nav nav a { display: inline-flex; align-items: center; gap: 5px; padding: 11px 4px; white-space: nowrap; }
.pb-nav nav a:hover { color: #215c9a !important; text-decoration: underline; text-underline-offset: 4px; }
.pb-nav nav a[aria-current] { box-shadow: 0 2px #2d615b; }
.pb-nav nav svg { width: 12px; height: 12px; }

@media (max-width: 580px) {
    .pb-nav-inner { width: calc(100% - 28px); }
    .pb-nav-brand span { display: none; }
    .pb-nav nav a { padding-inline: 0; }
}
</style>
