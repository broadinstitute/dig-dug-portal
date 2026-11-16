<template>
    <help-tooltip :label="`About ${label}`" :text="text" :table="table" />
</template>
<script>
import HelpTooltip from '../PbGene2/HelpTooltip.vue';
export default {
    name: 'ResultInfo',
    components: { HelpTooltip },
    props: { label: { type: String, required: true }, text: { type: String, required: true }, table: Object },
};
</script>
