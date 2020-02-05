<template>
    <div :class="'container-fluid '+this.$store.state.diseaseGroup+'kp-footer'">
        <div>METABOLIC DISORDERS KNOWLEDGE PORTAL</div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("page-footer", {
    data() {
        return {};
    }
});
</script>
