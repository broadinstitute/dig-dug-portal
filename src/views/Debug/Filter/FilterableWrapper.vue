<template>
    <FilterC>
        <Emitter slot-scope="value" :watchable="value" @change="$emit('change', value)">
            {{`the filter value is ${value}`}}
            <slot></slot>
        </Emitter>
    </FilterC>
</template>
<script>
import Vue from "vue";
import { Consumer as FilterC } from "./filterContext";
import Emitter from "./Emitter.vue"

// const Emitter = {
//     props: ['watchable'],
//     watch: {
//         watchable(newWatchValue) {
//             this.$emit('change', newWatchValue);
//         }
//     },
//     // Template just contains a slot, and a div to make it valid
//     // Eventually a the filterable-wrapper will have an event bound to it for 
//     // applying filters, from inside other components - so we need the slots.
//     // TODO: include runtime compiler in vue.config.js to allow this?
//     // template: `<div><slot></slot></div>`,

//     // ALTERNATELY: use createElement API with render functions?
//     render(createElement) {
//         return createElement('slot');
//     }
    
// }

export default Vue.component('filterable-wrapper', {
    components: {
        Emitter,
        FilterC,
    }
})
</script>