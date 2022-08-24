<template>
    <div>
        <div :class="'scroll-to-arrow'+this.toWhere">
            <a href="javascript:;" v-on:click="scrollToPoint(this.toWhere)">arrow</a>
        </div>
    </div>
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

