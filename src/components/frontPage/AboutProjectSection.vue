<template>
    <div>
        <div v-html="frontContents.field_about_project"></div>
    </div>
</template>

<script>

export default {
    name: "about-project-section",
    props: ["frontContents"]
};
</script>
