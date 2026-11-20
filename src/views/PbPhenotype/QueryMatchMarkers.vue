<template><span class="pbs-query-markers" role="img" :aria-label="ids.map((id,index) => name(id) + (matched[index] ? ': recorded' : ': not recorded')).join('; ')"><b-icon-square-fill v-for="(id,index) in ids" :key="id" :style="{color: matched[index] ? color(id,index) : '#e2e7ee'}" v-result-tooltip="name(id) + (matched[index] ? ': recorded' : ': not recorded')" aria-hidden="true"/></span></template>
<script>
import resultTooltip from './resultTooltip';
export default { directives: { resultTooltip }, props: { ids: Array, matched: Array, name: Function, termStyle: Function }, methods: { color(id,index) { return this.termStyle ? this.termStyle(id)['--tseg'] : ['#E69F00','#56B4E9','#009E73'][index%3]; } } };
</script>
