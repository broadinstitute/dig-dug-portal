<template>
    <div>
        <div
            v-html="frontContents.field_under_dataset_plots"
            class="under-datasets-section-wrapper"
        ></div>
    </div>
</template>

<script>

export default {
    name: "under-datasets-section",
    props: ["frontContents"],
};
</script>
