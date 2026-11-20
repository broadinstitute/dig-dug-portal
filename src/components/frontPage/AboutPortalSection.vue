<template>
    <div>
        <div v-html="frontContents.field_about_portal"></div>
    </div>
</template>

<script>

export default {
    name: "about-portal-section",
    props: ["frontContents"]
};
</script>
