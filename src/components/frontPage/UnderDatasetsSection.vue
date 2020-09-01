<template>
    <div>
        <div
            v-html="frontContents.field_under_dataset_plots"
            class="under-datasets-section-wrapper"
        ></div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("under-datasets-section", {
    props: ["frontContents"],
});
</script>
