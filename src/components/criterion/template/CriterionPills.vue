<template>

    <span v-if="!!filterList && filterList.length > 0" class="filter-pill-collection center">
        {{ header }}

        <b-badge
            pill
            v-for="(filter, idx) in filterList"
            :key="filter.field + filter.predicate + filter.threshold + idx"
            :class="`btn filter-pill-${filter.field}`"
            :style="{
                'background-color': `${
                    !!filter.color ? `${filter.color} !important` : ''
                }`,
            }"
            @click="clearable ? $emit('unset', filter) : () => {}"
        >
            {{
                !!filter.label
                    ? typeof filter.label === "function"
                        ? filter.label(filter)
                        : new String(filter.label)
                    : `${filter.field} = ${filter.threshold}`
            }}
            <span v-if="clearable" class="remove">X</span>
        </b-badge>
    </span>
</template>
<script>
import Vue from "vue"
export default Vue.component('criterion-pills', {
    props: {
        header: String,
        filterList: Array,
        clearable: {
            type: Boolean,
            default: false,
        }
    }
});
</script>