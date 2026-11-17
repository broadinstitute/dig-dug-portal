<template>
    <span class="pbs-info-control" @mouseenter="open" @mouseleave="scheduleClose">
        <button ref="anchor" class="pbs-info-button" type="button" :aria-label="'About ' + label" :aria-describedby="visible ? panelId : null" @focus="open" @blur="scheduleClose" @click.stop="open" @keydown.esc="close"><b-icon-info-circle aria-hidden="true" /></button>
        <aside v-show="visible" :id="panelId" ref="panel" class="pbs-info-panel" role="tooltip" :style="position" @mouseenter="cancelClose" @mouseleave="scheduleClose" @focusin="cancelClose" @focusout="scheduleClose">
            <strong>{{ label }}</strong>
            <p>{{ text }}</p>
            <ul v-if="links.length"><li v-for="link in links" :key="link.url"><a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }}</a></li></ul>
        </aside>
    </span>
</template>
<script>
const { sampleInfoPosition } = require('./sampleInfoPosition');
export default {
    props: { label: {type: String, required: true}, text: {type: String, required: true}, links: {type: Array, default: () => []} },
    data: () => ({ visible: false, position: {} }),
    computed: { panelId() { return `pbs-info-${this._uid}`; } },
    mounted() {
        this._shell = this.$el.closest('.pbg-shell');
        if (this._shell) this._shell.appendChild(this.$refs.panel);
        this.$root.$on('pbs:info-open', this.otherOpened);
        window.addEventListener('resize', this.reposition);
        window.addEventListener('scroll', this.reposition, true);
        document.addEventListener('pointerdown', this.outside, true);
        document.addEventListener('keydown', this.keydown);
    },
    beforeDestroy() {
        this.close();
        this.$root.$off('pbs:info-open', this.otherOpened);
        window.removeEventListener('resize', this.reposition);
        window.removeEventListener('scroll', this.reposition, true);
        document.removeEventListener('pointerdown', this.outside, true);
        document.removeEventListener('keydown', this.keydown);
        const panel = this.$refs.panel;
        if (panel && panel.parentNode === this._shell) panel.remove();
    },
    methods: {
        cancelClose() { clearTimeout(this._closeTimer); },
        scheduleClose() { this.cancelClose(); this._closeTimer = setTimeout(() => { if (!this.$refs.panel.contains(document.activeElement) && this.$refs.anchor !== document.activeElement) this.close(); }, 180); },
        open() { this.cancelClose(); this.$root.$emit('pbs:info-open', this.panelId); this.visible = true; this.$nextTick(this.reposition); },
        close() { this.cancelClose(); this.visible = false; },
        otherOpened(id) { if (id !== this.panelId) this.close(); },
        outside(event) { if (this.visible && !this.$el.contains(event.target) && !this.$refs.panel.contains(event.target)) this.close(); },
        keydown(event) { if (event.key === 'Escape') this.close(); },
        reposition() {
            if (!this.visible || !this._shell) return;
            const anchor = this.$refs.anchor.getBoundingClientRect();
            if (!anchor.width || anchor.bottom < 0 || anchor.top > window.innerHeight) { this.close(); return; }
            const box = sampleInfoPosition({ shell: this._shell.getBoundingClientRect(), shellWidth: this._shell.offsetWidth, anchor, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
            this.position = { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, maxHeight: `${box.maxHeight}px` };
        },
    },
};
</script>
