<template>
<span class="pbs-refine" v-result-tooltip="disabled ? 'This HPO is unavailable for CRDC sample searches. Each HPO needs at least 1 recorded CRDC sample.' : ''"><button type="button" :disabled="disabled" :class="exclude ? 'pbs-minus' : 'pbs-plus'" :aria-label="(exclude ? 'Exclude ' : 'Require ') + name + (disabled ? '; unavailable for CRDC sample searches' : '; ' + count + ' samples would remain')" @click="$emit('choose', id)"><b-icon-dash v-if="exclude" aria-hidden="true"/><b-icon-plus v-else aria-hidden="true"/></button><span>{{ count == null ? '—' : count.toLocaleString() }}</span></span>
</template>
<script>
import resultTooltip from './resultTooltip';
export default { directives: { resultTooltip }, props: { id: String, name: String, count: Number, exclude: Boolean, disabled: Boolean } };
</script>
