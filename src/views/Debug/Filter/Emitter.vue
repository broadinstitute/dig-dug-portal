<template>
    <div>
        <slot></slot>
    </div>
</template>
<script>
/*
 * This is a dummy component used ONLY by FilterableWrapper.
 * It just provides a slot for the Emitter, whose usage is just to emit an on-change event for its prop.
 * 
 * Emitting this event will allow for an easy way for components using FilterableWrapper (and thus the Consumer of the filterContext)
 * through binding to the @change event on it.
 * 
 * In this way, only the component using the filter has to know what it needs to do with it, and the page can provide a filter to any component
 * that wants it without having to explicitly pass it on. It's like a triple-blind study: no one knows why anyone is doing anything.
 * 
 * TODO: Refactor this dummy component into FilterableWrapper to eliminate it.
 */
import Vue from "vue"
export default Vue.component('emitter', {
    props: ['watchable'],
    watch: {
        watchable(newWatchValue) {
            this.$emit('change', newWatchValue);
        }
    }
})
</script>