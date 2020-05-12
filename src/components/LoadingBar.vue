<template>
    <div>
        <b-progress :value="this.$store.getters[`${module}/percentComplete`] * 100"></b-progress>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
export default Vue.component("loading-bar", {
    props: ["moduleIndex"],
    data: context => {
        return {
            module: Formatters.capitalizedFormatter(context.moduleIndex)
        };
    }
});
</script>
