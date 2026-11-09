<template>
    <button :id="tooltipId" type="button" class="pg2-help"
            :aria-label="label"
            v-b-tooltip.hover.focus.top="{ title: text, customClass: 'pg2-help-tooltip', boundary: 'window', delay: { show: 0, hide: 100 } }"
            @click.stop @keydown.esc.stop.prevent="$root.$emit('bv::hide::tooltip', tooltipId)">?</button>
</template>
<script>
export default {
    name: 'Gene2HelpTooltip',
    props: { label: { type: String, required: true }, text: { type: String, required: true } },
    data() { return { tooltipId: `pg2-help-${this._uid}` }; },
};
</script>
