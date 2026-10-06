<template>
    <footer class="mskkp-landing-footer">
        The MSK-KP is supported by the US National Institutes of Health
        National Institute of Arthritis and Musculoskeletal and Skin Diseases
        (NIH/NIAMS) grant AR085003.
    </footer>
</template>

<script>
import Vue from "vue";

export default Vue.component("mskkp-landing-footer", {
    props: ["diseaseGroup"],
});
</script>

<style>
.mskkp-landing-footer {
    width: 100%;
    background-color: #918bc3;
    color: #ffffff;
    text-align: center;
    padding: 16px 50px;
    box-sizing: border-box;
}
</style>
