<template>
    <div>
        <slot :test="test"></slot>
    </div>
</template>
<script>
import Vue from "vue";

export default Vue.component('lz-child', {
    props: ['test'],
    created() {
        console.log('child created')
    },
    mounted() {
        console.log('child mounted')
    },
    destroyed() {
        console.log('child destroyed')
    }
})
</script>
