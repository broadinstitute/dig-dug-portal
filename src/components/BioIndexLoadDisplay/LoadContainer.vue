<template>
    <load-bar v-bind:percent="percent"/>
    <pause-control v-bind:aborted="aborted"
                   v-bind:loading="loading"/>
    <abort-control v-bind:aborted="aborted"
                   v-bind:loading="loading"/>
</template>

<script>
    import LoadBar from "./LoadBar"
    import PauseControl from "./PauseControl";
    import AbortControl from "./AbortControl";

    export default {
        name: "LoadContainer",
        /* data, count: for LoadBar. aborted, loading: for LoadControl. */
        props: ["percentComplete", "aborted", "loading"],
        getters: {
            percent(_, props) {
                return props.percentComplete * 100;
            },
        },
        components: {
            "load-bar": LoadBar,
            "pause-control": PauseControl,
            "abort-control": AbortControl,
        },
    }
</script>

<style scoped>

</style>
