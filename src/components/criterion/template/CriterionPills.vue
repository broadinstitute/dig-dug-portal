<template>
    <!-- Pills for everything -->
    <span v-if="filterList.length > 0" class="filter-pill-collection center">
        {{ header }}
        <!-- Derive pills from current filter state?
                    Might lose coloring - unless we use something like my planned colorUtils with real-time schema generation on a cycle
                    It would be deterministic upto the compile-time declaration of the CriterionGroupTemplate controls which would lead to predicatable results at runtime
        -->
        <b-badge
            pill
            v-for="(filter, idx) in filterList"
            :key="filter.field + filter.predicate + filter.threshold + idx"
            :class="`btn filter-pill-${filter.field} ${cycleColors ? `color-${idx + 1}` : ''}`"
            :style="{
                'background-color': `${
                    !!filter.color && cycleColors === false ? `${filter.color} !important` : ''
                }`,
            }"
            @click="!!unset ? unset : $parent.$emit('unset', { filter, idx })">
            {{
                !!filter.label
                    ? typeof filter.label === "function"
                        ? filter.label(filter)
                        : new String(filter.label)
                    : `${filter.field} = ${filter.threshold}`
            }}
            <span class="remove">X</span>
        </b-badge>
    </span>
</template>
<script>
import Vue from "vue"
export default Vue.component('criterion-pills', {
    props: {
        header: {
            default: 'Selected Filters:\t'
        },
        filterList: Array,
        unset: {
            type: Function
        },
        cycleColors: {
            type: Boolean,
            default: false,
        }
    },
    created() {
        // if (!!this.unset) this.unset = this.
    }
});
</script>
