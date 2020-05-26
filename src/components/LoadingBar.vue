<template>
    <div>
        <b-progress :value="this.$store.getters[`${module}/percentComplete`] * 100"></b-progress>
    </div>
</template>

<script>
import Vue from "vue";
export default Vue.component("loading-bar", {
    props: ["moduleIndex"],
    data: (context) => {
        return {
        }
    },
});
</script>
