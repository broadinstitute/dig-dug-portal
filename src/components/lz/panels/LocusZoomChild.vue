<template>
    <div>
        <slot :test="test"></slot>
    </div>
</template>
<script>
import Vue from "vue";
import LZEvents, {
    LZ_LOAD_PANEL,
    LZ_LOAD_DATASOURCE,
    LZ_BROWSER_FORCE_REFRESH,
    LZ_ADD_PANEL,
    LZ_REMOVE_PANEL,
    LZ_CHILD_DESTROY_PANEL,
    LZ_BIOINDEX_QUERY_RESOLVE,
    LZ_BIOINDEX_QUERY_ERROR,
    LZ_BIOINDEX_QUERY_FINISH,
} from "@/components/lz/LocusZoomEvents"

export default Vue.component('lz-child', {
    props: ['test'],
    created() {
        console.log('child created')
        // LZEvents.$emit(LZ_LOAD_PANEL, this.test)
    },
    mounted() {
        console.log('child mounted')
    },
    destroyed() {
        console.log('child destroyed')
    }
})
</script>
