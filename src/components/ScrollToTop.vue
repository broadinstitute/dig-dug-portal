<template>
    <!-- <div :class="'scroll-to-arrow'+toWhere"> -->
        <a v-on:click="scrollToPoint(toWhere)"><slot>↑</slot></a>
    <!-- </div> -->
</template>

<script>
import Vue from "vue";

export default Vue.component("scroll-to-arrow", {
    props: ["toWhere"],
    methods: {
        scrollToPoint(toWhere) {
            window.scrollTo(0, 0);
        }
    }
});
</script>

