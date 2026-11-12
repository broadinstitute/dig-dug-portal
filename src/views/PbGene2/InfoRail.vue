<template>
    <aside v-if="current" id="pg2-info-panel" ref="panel" class="pg2-info-rail" :style="panelStyle"
           role="note" aria-labelledby="pg2-info-heading" @mouseenter="cancelClose" @mouseleave="scheduleClose">
        <div class="pg2-info-rail-heading"><strong id="pg2-info-heading">{{ current.label }}</strong><button type="button" aria-label="Close information" @click="close"><b-icon-x aria-hidden="true" /></button></div>
        <p id="pg2-info-content">{{ current.text }}</p>
        <ul v-if="current.links && current.links.length" class="pg2-info-sources" aria-label="Reference sources"><li v-for="link in current.links" :key="link.url"><a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }} <b-icon-box-arrow-up-right aria-hidden="true" /></a></li></ul>
    </aside>
</template>
<script>
import {infoRailPosition} from './infoRailPosition';
export default {
    name: 'Gene2InfoRail',
    data: () => ({current: null, pinned: false, reserved: false, placement: null}),
    computed: {
        panelStyle() {
            const p = this.placement;
            return p && p.layout !== 'reserve' ? {left: `${p.left}px`, top: `${p.top}px`, width: `${p.width}px`} : {visibility: 'hidden'};
        },
    },
    mounted() {
        this.$root.$on('pg2:info-open', this.open);
        this.$root.$on('pg2:info-leave', this.leave);
        this.$root.$on('pg2:info-close', this.close);
        window.addEventListener('resize', this.reposition);
        window.addEventListener('scroll', this.reposition, true);
        document.addEventListener('pointerdown', this.outside, true);
        document.addEventListener('keydown', this.keydown);
    },
    beforeDestroy() {
        this.close();
        this.$root.$off('pg2:info-open', this.open);
        this.$root.$off('pg2:info-leave', this.leave);
        this.$root.$off('pg2:info-close', this.close);
        window.removeEventListener('resize', this.reposition);
        window.removeEventListener('scroll', this.reposition, true);
        document.removeEventListener('pointerdown', this.outside, true);
        document.removeEventListener('keydown', this.keydown);
    },
    methods: {
        cancelClose() { clearTimeout(this._closeTimer); },
        leave(id) { if (this.current && this.current.id === id) this.scheduleClose(); },
        scheduleClose() { this.cancelClose(); if (!this.pinned) this._closeTimer = setTimeout(this.close, 200); },
        open(value) {
            this.cancelClose();
            const same = this.current && this.current.id === value.id;
            if (same && value.pin && this.pinned) { this.close(); return; }
            this.restoreGap();
            this.pinned = value.pin || Boolean(same && this.pinned);
            this.current = value;
            this.$root.$emit('pg2:info-active', value.id);
            this.$nextTick(this.reposition);
        },
        close() {
            this.cancelClose(); this.restoreGap();
            this.current = null; this.pinned = false; this.placement = null; this.reserved = false;
            this.$emit('reserve', false); this.$root.$emit('pg2:info-active', '');
        },
        restoreGap() { if (this._gapCard) {this._gapCard.style.marginBottom = this._gapValue; this._gapCard = null;} },
        outside(event) { if (this.current && !this.current.anchor.contains(event.target) && !(this.$refs.panel && this.$refs.panel.contains(event.target))) this.close(); },
        keydown(event) { if (event.key === 'Escape' && this.current) this.close(); },
        reposition() {
            if (!this.current) return;
            const current = this.current;
            const anchor = current.anchor;
            if (!anchor.isConnected) {this.close(); return;}
            const shell = anchor.closest('.pbg-shell');
            const card = anchor.closest('.pg2-card');
            if (!shell) return;
            const bounds = anchor.getBoundingClientRect();
            if (bounds.bottom < 0 || bounds.top > window.innerHeight) {this.close(); return;}
            this.placement = infoRailPosition({shell: shell.getBoundingClientRect(), shellWidth: shell.offsetWidth,
                anchor: bounds, card: card && card.getBoundingClientRect(), viewportWidth: window.innerWidth, reserved: this.reserved});
            if (this.placement.layout === 'reserve') {
                this.reserved = true; this.$emit('reserve', true); this.$nextTick(this.reposition); return;
            }
            this.$nextTick(() => {
                if (this.current !== current || !this.$refs.panel) return;
                if (this.placement.layout === 'inline' && card) {
                    if (this._gapCard !== card) {this.restoreGap();this._gapCard = card;this._gapValue = card.style.marginBottom;}
                    card.style.marginBottom = `${this.$refs.panel.offsetHeight + 32}px`;
                } else this.restoreGap();
            });
        },
    },
};
</script>
