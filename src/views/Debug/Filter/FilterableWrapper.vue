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

const Emitter = {
    /*
    * This is a dummy component used ONLY by FilterableWrapper.
    * It just provides a slot for the Emitter, whose job is just to emit an on-change event for its prop.
    * 
    * Emitting this event will allow for an easy way for components to use FilterableWrapper (and thus the Consumer of the filterContext)
    * through binding to the @change event on it (with e.g. an applyFilter function). This wouldn't have been possible otherwise with the Consumer alone.
    * 
    * In this way, only the component using the filter has to know what it needs to do with it, and the page can provide a filter to any component
    * that wants it without having to explicitly pass it on. 
    * 
    * It's like a triple-blind study: no one should know why anyone is doing anything.
    * 
    */
    props: ['watchable'],
    watch: {
        watchable(newWatchValue) {
            this.$emit('change', newWatchValue);
        }
    },
    render(createElement) {
        
        // Using Vue's createElement API with render functions to eliminate the need to define Emitter in a separate component file.
        // Without using Vue's runtime compiler (bloat), we can't define scoped slots directly in it, so instead we use an undocumented internal 
        // feature – of course – to give the element a default slot.
        // So don't touch this, it works great
        // https://stackoverflow.com/a/58859267

        return createElement('div', this.$scopedSlots.default());
    }
    
}

export default Vue.component('filterable-wrapper', {
    components: {
        Emitter,
        FilterC,
    }
})
</script>