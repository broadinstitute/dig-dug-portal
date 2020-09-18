<template>
    <FilterConsumer>
        <Emitter slot-scope="value" :watchable="value" @change="$emit('change', value)">
            <slot><span></span></slot>
        </Emitter>
    </FilterConsumer>
</template>

<script>
import Vue from "vue";
import { Consumer as FilterConsumer } from "@/utils/filterHelpers";

/**
 * FilterContextReceiver.vue
 * 
 * This is a Higher-Order Component (HoC) that can't be used on its own.
 * Instead, you wrap a concrete component (like LocusZoom, or AssociationsTable) to allow them to consume a filter function from a FilterContextGiver.
 *
 * For example:
 * 
 *  <filter-context-giver :value="element => !!element.pValue && element.pValue < 0.01">
 * 
 *     <!-- Different components will have different applyFilter functions, and thus should have different wrappers listening to the same context -->
 *     <filter-context-receiver @change="$refs.locuszoom.applyFilter($event)">
 *          <!-- $event will be equal to the function `element => !!element.pValue && element.pValue < 0.01`  -->
 *          <locuszoom
 *              ref="locuszoom"
 *           ></locuszoom>
 *      </filter-context-receiver>
 * 
 *  </filter-context-giver>
 * 
 * NOTE: If you are always going to use a component with a filter, you can define use the filter-context-receiver HoC inside of that component's template instead.
 * This allows you to avoid having to use refs.
 * 
 */

const Emitter = {
    /*
    * This is a dummy component used ONLY by FilterContextReceiver.
    * It just provides a slot for the Emitter, whose job is just to emit an on-change event for its prop.
    * 
    * Emitting this event will allow for an easy way for components to use FilterContextReceiver (and thus the Consumer of the filterContext)
    * through binding to the @change event on it (with e.g. an applyFilter function). This wouldn't have been possible otherwise with the Consumer alone.
    * 
    * In this way, only the component using the filter has to know what it needs to do with it, and the page can provide a filter to any component
    * that wants it without having to explicitly pass it on. 
    * 
    * It's like a triple-blind study: no one should know why anyone is doing anything. That's decoupling, folks. But don't tell your local bureaucrats.
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

export default Vue.component('filter-context-receiver', {
    components: {
        Emitter,
        FilterConsumer,
    }
})
</script>