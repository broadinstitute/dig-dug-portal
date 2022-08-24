<template>
    <ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; list-style-type: none; padding: 0; margin: 0; column-gap:10px">
        <li v-for="(curie, index) in data.value" 
            :key="curie"
            :class="index > 10 ? 'hidden' : `${curie}-link-wrapper`" 
            :id="`${curie}-link-${index}-${data.index}`">
            <results-tooltip
                :target="`${curie}-link-${data.index}-${index}`"
                :query_graph="query_graph"
                :rowData="data"
                :curie="curie"
                :key="`${curie}_tooltip`"
            ></results-tooltip>

            <span :id="`${curie}-link-${data.index}-${index}`">
                <resolved-curie-link
                    :key="`${curie}_item`"
                    :curie="curie">
                </resolved-curie-link>
                <!-- {{index == (data.value.length - 1) ? '' : ', '}} -->
            </span>
        </li>
    </ul>
</template>
<script>
import Vue from "vue";

export default Vue.component('column-list', {
    props: {
        list: Array,
        // columns: {
        //     type: Number,
        //     default: 3
        // }
    }
})
</script>
