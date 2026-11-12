<template>
    <button :id="tooltipId" type="button" class="pg2-help" :aria-label="label"
            :aria-expanded="String(active)" aria-controls="pg2-info-panel"
            :aria-describedby="active ? 'pg2-info-content' : null"
            @mouseenter="open(false)" @mouseleave="leave" @focus="open(false)" @blur="leave"
            @click.stop="open(true)" @keydown.esc.stop.prevent="close"><b-icon-info-circle aria-hidden="true" /></button>
</template>
<script>
export default {
    name: 'Gene2HelpTooltip',
    props: { label: { type: String, required: true }, text: { type: String, required: true }, links: { type: Array, default: () => [] }, info: { type: Boolean, default: true } },
    data() { return { tooltipId: `pg2-help-${this._uid}`, active: false }; },
    mounted() { this.$root.$on('pg2:info-active', this.setActive); },
    beforeDestroy() { this.$root.$off('pg2:info-active', this.setActive); if (this.active) this.close(); },
    methods: {
        setActive(id) { this.active = id === this.tooltipId; },
        open(pin) { this.$root.$emit('pg2:info-open', {id: this.tooltipId, label: this.label, text: this.text, links: this.links, anchor: this.$el, pin}); },
        leave() { this.$root.$emit('pg2:info-leave', this.tooltipId); },
        close() { this.$root.$emit('pg2:info-close'); },
    },
};
</script>
