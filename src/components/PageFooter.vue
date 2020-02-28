<template>
    <div :class="'container-fluid '+diseaseGroup+'kp-footer'">
        <div>
            Powered by the
            <span
                style="font-weight:600; font-size: 1.2em; vertical-align:-.1em;"
            >AMP-T2DKP</span> platform
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("page-footer", {
    data() {
        return {};
    },
    computed: {
        diseaseGroup() {
            return this.$store.state.diseaseGroup.id;
        }
    }
});
</script>
