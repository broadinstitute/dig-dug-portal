<template>
    <div>
        <div :class="'scroll-to-arrow'+this.toWhere">
            <a href="javascript:;" v-on:click="scrollToPoint(this.toWhere)">arrow</a>
        </div>
    </div>
</template>

<script>

export default {
    name: "scroll-to-arrow",
    props: ["toWhere"],
    methods: {
        scrollToPoint(toWhere) {
            window.scrollTo(0, 0);
        }
    }
};
</script>

